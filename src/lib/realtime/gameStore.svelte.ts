import type {
	GameEvent,
	LegalActions,
	Phase,
	PlayerAction,
	PublicPlayer,
	PlayerView,
	SessionSummary,
	SessionStatePayload,
	PlayerJoinedPayload,
	PlayerLeftPayload,
	PlayerStatusPayload,
	YourTurnPayload
} from './protocol';

const EVENTS_CAP = 50;

interface YourTurnState {
	legalActions: LegalActions;
	deadlineMs: number;
	issuedAtMs: number;
}

interface GameStoreState {
	session: SessionSummary | null;
	table: PlayerView | null;
	yourTurn: YourTurnState | null;
	events: GameEvent[];
	currentUserId: string | null;
	now: number;
}

const state = $state<GameStoreState>({
	session: null,
	table: null,
	yourTurn: null,
	events: [],
	currentUserId: null,
	now: Date.now()
});

// ──────────────────────────────────────────────────────────────────────────────
// Derived values — read-only views consumed by components
// ──────────────────────────────────────────────────────────────────────────────

export const derived = {
	get session(): SessionSummary | null {
		return state.session;
	},
	get table(): PlayerView | null {
		return state.table;
	},
	get phase(): Phase | null {
		return state.table?.phase ?? null;
	},
	get board() {
		return state.table?.board ?? [];
	},
	get pots() {
		return state.table?.pots ?? [];
	},
	get potTotal(): number {
		const t = state.table;
		if (!t) return 0;
		const inPots = t.pots.reduce((s, p) => s + p.amount, 0);
		const onTable = t.players.reduce((s, p) => s + p.currentBet, 0);
		return inPots + onTable;
	},
	get currentBet(): number {
		return state.table?.currentBet ?? 0;
	},
	get dealerSeat(): number | null {
		return state.table?.buttonSeat ?? null;
	},
	get toActSeat(): number | null {
		return state.table?.toActSeat ?? null;
	},
	get currentUserId(): string | null {
		return state.currentUserId;
	},
	get myPlayer(): PublicPlayer | null {
		const uid = state.currentUserId;
		if (!uid || !state.table) return null;
		return state.table.players.find((p) => p.id === uid) ?? null;
	},
	get mySeatIndex(): number | null {
		return derived.myPlayer?.seat ?? null;
	},
	get yourHoleCards() {
		return state.table?.yourHoleCards ?? null;
	},
	get isSpectator(): boolean {
		return derived.myPlayer === null;
	},
	get isMyTurn(): boolean {
		const me = derived.myPlayer;
		const t = state.table;
		return state.yourTurn !== null && t != null && me != null && t.toActSeat === me.seat;
	},
	get myLegalActions(): LegalActions | null {
		return state.yourTurn?.legalActions ?? null;
	},
	get secondsRemaining(): number {
		if (!state.yourTurn) return 0;
		return Math.max(0, (state.yourTurn.deadlineMs - state.now) / 1000);
	},
	get turnProgress(): number {
		const yt = state.yourTurn;
		if (!yt) return 0;
		const total = yt.deadlineMs - yt.issuedAtMs;
		if (total <= 0) return 0;
		return Math.max(0, Math.min(1, (yt.deadlineMs - state.now) / total));
	},
	get activePlayers(): PublicPlayer[] {
		if (!state.table) return [];
		return state.table.players.filter((p) => p.status === 'sitting');
	},
	get events(): readonly GameEvent[] {
		return state.events;
	},
	get canActOnSeats(): boolean {
		const ph = state.table?.phase;
		return ph === 'waiting' || ph === 'between_hands';
	},
	get canSitDown(): boolean {
		return derived.canActOnSeats && derived.isSpectator;
	},
	get canStandUp(): boolean {
		return derived.canActOnSeats && derived.myPlayer != null;
	},
	get canRebuy(): boolean {
		const me = derived.myPlayer;
		const t = state.table;
		if (!derived.canActOnSeats || !me || !t) return false;
		return me.stack < t.config.maxBuyIn;
	},
	get canStartHand(): boolean {
		if (!derived.canActOnSeats) return false;
		return derived.activePlayers.length >= 2;
	}
};

// ──────────────────────────────────────────────────────────────────────────────
// Mutations — called from socket event handlers and the route page
// ──────────────────────────────────────────────────────────────────────────────

function pushEvent(evt: GameEvent): void {
	state.events.push(evt);
	if (state.events.length > EVENTS_CAP) {
		state.events.splice(0, state.events.length - EVENTS_CAP);
	}
}

function findPlayer(playerId: string): PublicPlayer | undefined {
	return state.table?.players.find((p) => p.id === playerId);
}

function patchFromAction(playerId: string, action: PlayerAction): void {
	const p = findPlayer(playerId);
	const t = state.table;
	if (!p || !t) return;

	const previousBet = p.currentBet;
	switch (action.type) {
		case 'fold':
			p.folded = true;
			p.inHand = false;
			break;
		case 'check':
			break;
		case 'call': {
			const target = t.currentBet;
			const delta = Math.max(0, target - previousBet);
			const paid = Math.min(delta, p.stack);
			p.currentBet = previousBet + paid;
			p.stack -= paid;
			p.totalContributed += paid;
			if (p.stack === 0) p.allIn = true;
			break;
		}
		case 'bet':
		case 'raise': {
			const target = action.amount ?? previousBet;
			const delta = Math.max(0, target - previousBet);
			const paid = Math.min(delta, p.stack);
			p.currentBet = previousBet + paid;
			p.stack -= paid;
			p.totalContributed += paid;
			t.currentBet = Math.max(t.currentBet, p.currentBet);
			if (p.stack === 0) p.allIn = true;
			break;
		}
		case 'all_in': {
			const paid = p.stack;
			p.currentBet = previousBet + paid;
			p.stack = 0;
			p.totalContributed += paid;
			p.allIn = true;
			t.currentBet = Math.max(t.currentBet, p.currentBet);
			break;
		}
	}
}

export const gameStore = {
	setCurrentUserId(id: string | null): void {
		state.currentUserId = id;
	},

	setSnapshot(payload: SessionStatePayload): void {
		state.session = payload.session;
		state.table = payload.table;
		state.events = [...payload.history];
		state.yourTurn = null;
	},

	applyEvent(evt: GameEvent): void {
		pushEvent(evt);
		const t = state.table;
		if (!t) return;

		switch (evt.type) {
			case 'hand_started':
				t.handNumber = evt.handNumber;
				t.buttonSeat = evt.buttonSeat;
				t.board = [];
				t.pots = [];
				t.currentBet = 0;
				for (const p of t.players) {
					p.currentBet = 0;
					p.totalContributed = 0;
					p.folded = false;
					p.allIn = false;
					p.inHand = p.status === 'sitting';
				}
				break;
			case 'blinds_posted': {
				const sb = evt.smallBlind;
				if (sb) {
					const sp = findPlayer(sb.playerId);
					if (sp) {
						sp.currentBet += sb.amount;
						sp.stack -= sb.amount;
						sp.totalContributed += sb.amount;
					}
				}
				const bp = findPlayer(evt.bigBlind.playerId);
				if (bp) {
					bp.currentBet += evt.bigBlind.amount;
					bp.stack -= evt.bigBlind.amount;
					bp.totalContributed += evt.bigBlind.amount;
				}
				t.currentBet = Math.max(t.currentBet, evt.bigBlind.amount);
				break;
			}
			case 'ante_posted':
				for (const [pid, amt] of Object.entries(evt.amounts)) {
					const p = findPlayer(pid);
					if (p) {
						p.stack -= amt;
						p.totalContributed += amt;
					}
				}
				break;
			case 'hole_cards_dealt':
				// Only the receiver gets non-null cards; mirror onto yourHoleCards.
				if (evt.cards && evt.playerId === state.currentUserId) {
					t.yourHoleCards = evt.cards;
				}
				break;
			case 'action_required':
				t.toActSeat = findPlayer(evt.playerId)?.seat ?? t.toActSeat;
				break;
			case 'action_taken':
				patchFromAction(evt.playerId, evt.action);
				break;
			case 'board_dealt':
				t.board = [...t.board, ...evt.cards];
				// Collect bets into the pot when a new street starts.
				{
					const collected = t.players.reduce((s, p) => s + p.currentBet, 0);
					if (collected > 0) {
						const pot = t.pots[0];
						if (pot) {
							pot.amount += collected;
						} else {
							t.pots = [
								{
									amount: collected,
									eligiblePlayerIds: t.players.filter((p) => p.inHand && !p.folded).map((p) => p.id)
								}
							];
						}
						for (const p of t.players) p.currentBet = 0;
						t.currentBet = 0;
					}
				}
				break;
			case 'phase_changed':
				t.phase = evt.to;
				if (evt.to === 'between_hands' || evt.to === 'waiting') {
					t.toActSeat = null;
				}
				break;
			case 'showdown':
				// Reveals come for animation; the server filters yourHoleCards already.
				break;
			case 'pot_awarded': {
				const pot = t.pots[evt.potIndex];
				if (pot) pot.amount = 0;
				for (const w of evt.winners) {
					const p = findPlayer(w.playerId);
					if (p) p.stack += w.amount;
				}
				break;
			}
			case 'hand_complete':
				for (const [pid, stack] of Object.entries(evt.finalStacks)) {
					const p = findPlayer(pid);
					if (p) p.stack = stack;
				}
				for (const p of t.players) {
					p.currentBet = 0;
					p.totalContributed = 0;
				}
				t.currentBet = 0;
				t.toActSeat = null;
				t.yourHoleCards = null;
				t.pots = [];
				break;
			case 'player_eliminated': {
				const p = findPlayer(evt.playerId);
				if (p) p.inHand = false;
				break;
			}
		}
	},

	applyPlayerJoined(p: PlayerJoinedPayload): void {
		const t = state.table;
		if (!t) return;
		if (t.players.some((pl) => pl.id === p.userId)) return;
		t.players.push({
			id: p.userId,
			seat: p.seat,
			stack: p.stack,
			status: 'sitting',
			inHand: false,
			folded: false,
			allIn: false,
			currentBet: 0,
			totalContributed: 0
		});
	},

	applyPlayerLeft(p: PlayerLeftPayload): void {
		const t = state.table;
		if (!t) return;
		t.players = t.players.filter((pl) => pl.id !== p.userId);
	},

	applyPlayerStatus(p: PlayerStatusPayload): void {
		const t = state.table;
		if (!t) return;
		const player = t.players.find((pl) => pl.id === p.userId);
		if (player) player.status = p.status;
	},

	setYourTurn(payload: YourTurnPayload): void {
		state.yourTurn = {
			legalActions: payload.legalActions,
			deadlineMs: payload.deadlineMs,
			issuedAtMs: Date.now()
		};
	},

	clearYourTurn(): void {
		state.yourTurn = null;
	},

	applyHandComplete(): void {
		// The hand_complete GameEvent already patched stacks; this hook exists for
		// triggering UI side-effects (sound, summary banner) from the route page.
		state.yourTurn = null;
	},

	tick(now: number): void {
		state.now = now;
	},

	reset(): void {
		state.session = null;
		state.table = null;
		state.yourTurn = null;
		state.events = [];
		state.now = Date.now();
	}
};
