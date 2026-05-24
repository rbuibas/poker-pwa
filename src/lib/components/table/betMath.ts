import type { LegalActions, Pot, PublicPlayer } from '$lib/realtime/protocol';

export interface PresetInput {
	pots: Pot[];
	players: PublicPlayer[];
	myCurrentBet: number;
	myStack: number;
	currentBet: number;
	bigBlind: number;
	legalActions: LegalActions;
}

export interface Preset {
	label: string;
	amount: number;
}

export interface Presets {
	half: Preset | null;
	threeQuarter: Preset | null;
	pot: Preset | null;
	allIn: Preset | null;
}

function potTotalBefore(pots: Pot[], players: PublicPlayer[]): number {
	return pots.reduce((s, p) => s + p.amount, 0) + players.reduce((s, p) => s + p.currentBet, 0);
}

function clampStep(amount: number, step: number): number {
	if (step <= 0) return Math.round(amount);
	return Math.round(amount / step) * step;
}

/**
 * Clamp to the engine's legal range. Returns null if the requested target falls
 * outside `[min, max]` (e.g. a ½-pot raise that's smaller than `minRaise`).
 */
function clampToLegal(target: number, legal: LegalActions, mode: 'bet' | 'raise'): number | null {
	const min = mode === 'raise' ? legal.minRaise : legal.minBet;
	const max = legal.maxRaise;
	if (max <= 0) return null;
	if (target > max) return max;
	if (target < min) return null;
	return target;
}

export function computePresets(input: PresetInput): Presets {
	const { pots, players, myCurrentBet, myStack, currentBet, bigBlind, legalActions } = input;
	const step = Math.max(1, bigBlind);
	const mode: 'bet' | 'raise' = legalActions.canRaise ? 'raise' : 'bet';
	const potBefore = potTotalBefore(pots, players);

	function build(fraction: number, label: string): Preset | null {
		if (!legalActions.canBet && !legalActions.canRaise) return null;
		const raw = mode === 'raise' ? currentBet + potBefore * fraction : potBefore * fraction;
		const snapped = clampStep(raw, step);
		const clamped = clampToLegal(snapped, legalActions, mode);
		if (clamped === null) return null;
		return { label, amount: clamped };
	}

	function buildAllIn(): Preset | null {
		const target = myCurrentBet + myStack;
		if (target <= 0) return null;
		const clamped = clampToLegal(target, legalActions, mode);
		if (clamped === null) return null;
		return { label: 'All-in', amount: clamped };
	}

	return {
		half: build(0.5, '½ Pot'),
		threeQuarter: build(0.75, '¾ Pot'),
		pot: build(1, 'Pot'),
		allIn: buildAllIn()
	};
}

/** Min/max/step for the bet slider, derived from the legal actions. */
export function sliderBounds(
	legal: LegalActions,
	bigBlind: number
): { min: number; max: number; step: number } | null {
	if (!legal.canBet && !legal.canRaise) return null;
	const min = legal.canRaise ? legal.minRaise : legal.minBet;
	const max = legal.maxRaise;
	if (max <= 0 || max < min) return null;
	return { min, max, step: Math.max(1, bigBlind) };
}
