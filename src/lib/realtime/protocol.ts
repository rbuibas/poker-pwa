/**
 * Client-side mirror of the poker-server WebSocket protocol contract.
 *
 * Upstream sources (kept in sync manually):
 *   - poker-engine/src/types.ts      (engine types: Card, Phase, LegalActions, GameEvent, …)
 *   - poker-server/src/protocol/types.ts (session payloads, error codes)
 *
 * TODO: when the sibling packages live in a workspace, replace this file with
 * `export * from 'poker-engine'; export * from 'poker-server/protocol';`.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Engine types
// ──────────────────────────────────────────────────────────────────────────────

export type Suit = 'h' | 'd' | 'c' | 's';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
	rank: Rank;
	suit: Suit;
}

export type PlayerStatus = 'sitting' | 'sitout' | 'away';

export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all_in';

export interface PlayerAction {
	type: ActionType;
	amount?: number;
}

export type Phase =
	| 'waiting'
	| 'preflop'
	| 'flop'
	| 'turn'
	| 'river'
	| 'showdown'
	| 'between_hands';

export type BoardPhase = 'flop' | 'turn' | 'river';

export interface Pot {
	amount: number;
	eligiblePlayerIds: string[];
}

export interface LegalActions {
	canFold: boolean;
	canCheck: boolean;
	canCall: boolean;
	callAmount: number;
	canBet: boolean;
	minBet: number;
	canRaise: boolean;
	minRaise: number;
	maxRaise: number;
}

export interface TableConfig {
	smallBlind: number;
	bigBlind: number;
	ante: number;
	maxPlayers: number;
	defaultBuyIn: number;
	minBuyIn: number;
	maxBuyIn: number;
	buttonSeat?: number;
}

export interface PublicPlayer {
	id: string;
	seat: number;
	stack: number;
	status: PlayerStatus;
	inHand: boolean;
	folded: boolean;
	allIn: boolean;
	currentBet: number;
	totalContributed: number;
}

export interface PublicTableState {
	config: TableConfig;
	phase: Phase;
	handNumber: number;
	buttonSeat: number;
	smallBlindSeat: number | null;
	bigBlindSeat: number | null;
	board: Card[];
	pots: Pot[];
	currentBet: number;
	minRaise: number;
	toActSeat: number | null;
	players: PublicPlayer[];
}

export interface PlayerView extends PublicTableState {
	yourHoleCards: [Card, Card] | null;
}

export type GameEvent =
	| { type: 'hand_started'; handNumber: number; buttonSeat: number }
	| {
			type: 'blinds_posted';
			smallBlind: { playerId: string; amount: number } | null;
			bigBlind: { playerId: string; amount: number };
	  }
	| { type: 'ante_posted'; amounts: Record<string, number> }
	| { type: 'hole_cards_dealt'; playerId: string; cards: [Card, Card] | null }
	| { type: 'action_required'; playerId: string; legalActions: LegalActions }
	| { type: 'action_taken'; playerId: string; action: PlayerAction }
	| { type: 'board_dealt'; phase: BoardPhase; cards: Card[] }
	| { type: 'phase_changed'; from: Phase; to: Phase }
	| {
			type: 'showdown';
			reveals: { playerId: string; cards: [Card, Card]; handDescription: string }[];
	  }
	| {
			type: 'pot_awarded';
			potIndex: number;
			winners: { playerId: string; amount: number }[];
	  }
	| { type: 'hand_complete'; finalStacks: Record<string, number> }
	| { type: 'player_eliminated'; playerId: string };

// ──────────────────────────────────────────────────────────────────────────────
// Server payloads
// ──────────────────────────────────────────────────────────────────────────────

export interface SessionSummary {
	id: string;
	loungeId: string;
	startedAt: string;
	handsPlayed: number;
	status: 'active' | 'ended';
}

export interface SessionStatePayload {
	session: SessionSummary;
	table: PlayerView;
	history: GameEvent[];
}

export interface PlayerJoinedPayload {
	userId: string;
	seat: number;
	stack: number;
}

export interface PlayerLeftPayload {
	userId: string;
	reason: 'stood_up' | 'kicked';
}

export interface PlayerStatusPayload {
	userId: string;
	status: PlayerStatus;
}

export interface YourTurnPayload {
	legalActions: LegalActions;
	deadlineMs: number;
}

export interface HandSummaryWinner {
	playerId: string;
	amount: number;
}

export interface HandSummaryShowdownReveal {
	playerId: string;
	cards: [Card, Card];
	handDescription: string;
}

export interface HandSummary {
	handNumber: number;
	board: Card[];
	potTotal: number;
	pots: { potIndex: number; winners: HandSummaryWinner[] }[];
	showdown: HandSummaryShowdownReveal[] | null;
	finalStacks: Record<string, number>;
}

export interface HandCompletePayload {
	handId: string | null;
	summary: HandSummary;
}

export type ErrorCode =
	| 'auth_failed'
	| 'not_member'
	| 'not_owner'
	| 'invalid_action'
	| 'hand_in_progress'
	| 'not_your_turn'
	| 'invalid_amount'
	| 'seat_taken'
	| 'no_active_session'
	| 'no_hand_in_progress'
	| 'internal_error'
	| 'server_shutting_down'
	| 'rate_limited';

export interface ServerErrorPayload {
	code: ErrorCode;
	message: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Client → server payloads
// ──────────────────────────────────────────────────────────────────────────────

export interface SessionStartPayload {
	loungeId: string;
}
export interface SessionJoinRoomPayload {
	loungeId: string;
}
export interface SessionLeaveRoomPayload {
	loungeId: string;
}
export interface SessionSitDownPayload {
	loungeId: string;
	seat: number;
	buyIn: number;
}
export interface SessionStandUpPayload {
	loungeId: string;
}
export interface SessionRebuyPayload {
	loungeId: string;
	amount: number;
}
export interface SessionSitOutPayload {
	loungeId: string;
	sitOut: boolean;
}
export interface SessionKickPayload {
	loungeId: string;
	targetUserId: string;
}
export interface HandStartPayload {
	loungeId: string;
}
export interface HandActionPayload {
	loungeId: string;
	action: PlayerAction;
}

// ──────────────────────────────────────────────────────────────────────────────
// Typed Socket.IO event maps
// ──────────────────────────────────────────────────────────────────────────────

export interface ServerToClientEvents {
	'session:state': (payload: SessionStatePayload) => void;
	'session:player_joined': (payload: PlayerJoinedPayload) => void;
	'session:player_left': (payload: PlayerLeftPayload) => void;
	'session:player_status': (payload: PlayerStatusPayload) => void;
	'hand:event': (event: GameEvent) => void;
	'hand:your_turn': (payload: YourTurnPayload) => void;
	'hand:complete': (payload: HandCompletePayload) => void;
	error: (payload: ServerErrorPayload) => void;
	pong: (payload: { t: number }) => void;
}

export interface ClientToServerEvents {
	'session:start': (payload: SessionStartPayload) => void;
	'session:join_room': (payload: SessionJoinRoomPayload) => void;
	'session:leave_room': (payload: SessionLeaveRoomPayload) => void;
	'session:sit_down': (payload: SessionSitDownPayload) => void;
	'session:stand_up': (payload: SessionStandUpPayload) => void;
	'session:rebuy': (payload: SessionRebuyPayload) => void;
	'session:sit_out': (payload: SessionSitOutPayload) => void;
	'session:kick': (payload: SessionKickPayload) => void;
	'hand:start': (payload: HandStartPayload) => void;
	'hand:action': (payload: HandActionPayload) => void;
	ping: () => void;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
