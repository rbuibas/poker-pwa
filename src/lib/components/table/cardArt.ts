import type { Rank, Suit } from '$lib/realtime/protocol';

export const SUIT_GLYPH: Record<Suit, string> = {
	h: '♥', // ♥
	d: '♦', // ♦
	c: '♣', // ♣
	s: '♠' // ♠
};

export const SUIT_COLOR_VAR: Record<Suit, string> = {
	h: 'var(--suit-hearts)',
	d: 'var(--suit-diamonds)',
	c: 'var(--suit-clubs)',
	s: 'var(--suit-spades)'
};

export const SUIT_NAME: Record<Suit, string> = {
	h: 'Hearts',
	d: 'Diamonds',
	c: 'Clubs',
	s: 'Spades'
};

const RANK_DISPLAY: Record<Rank, string> = {
	'2': '2',
	'3': '3',
	'4': '4',
	'5': '5',
	'6': '6',
	'7': '7',
	'8': '8',
	'9': '9',
	T: '10',
	J: 'J',
	Q: 'Q',
	K: 'K',
	A: 'A'
};

const RANK_NAME: Record<Rank, string> = {
	'2': 'Two',
	'3': 'Three',
	'4': 'Four',
	'5': 'Five',
	'6': 'Six',
	'7': 'Seven',
	'8': 'Eight',
	'9': 'Nine',
	T: 'Ten',
	J: 'Jack',
	Q: 'Queen',
	K: 'King',
	A: 'Ace'
};

export function rankLabel(rank: Rank): string {
	return RANK_DISPLAY[rank];
}

export function cardLabel(rank: Rank, suit: Suit): string {
	return `${RANK_NAME[rank]} of ${SUIT_NAME[suit]}`;
}

export function isRed(suit: Suit): boolean {
	return suit === 'h' || suit === 'd';
}

/**
 * Pip layout for traditional card faces. Coordinates are in a 0..1 unit grid;
 * the Card component maps them to its render box. Picture cards (J/Q/K) and
 * the Ace use a single centered glyph.
 */
const PIP_GRID: Record<Rank, [number, number][]> = {
	'2': [
		[0.5, 0.22],
		[0.5, 0.78]
	],
	'3': [
		[0.5, 0.22],
		[0.5, 0.5],
		[0.5, 0.78]
	],
	'4': [
		[0.3, 0.22],
		[0.7, 0.22],
		[0.3, 0.78],
		[0.7, 0.78]
	],
	'5': [
		[0.3, 0.22],
		[0.7, 0.22],
		[0.5, 0.5],
		[0.3, 0.78],
		[0.7, 0.78]
	],
	'6': [
		[0.3, 0.22],
		[0.7, 0.22],
		[0.3, 0.5],
		[0.7, 0.5],
		[0.3, 0.78],
		[0.7, 0.78]
	],
	'7': [
		[0.3, 0.22],
		[0.7, 0.22],
		[0.5, 0.36],
		[0.3, 0.5],
		[0.7, 0.5],
		[0.3, 0.78],
		[0.7, 0.78]
	],
	'8': [
		[0.3, 0.22],
		[0.7, 0.22],
		[0.5, 0.36],
		[0.3, 0.5],
		[0.7, 0.5],
		[0.5, 0.64],
		[0.3, 0.78],
		[0.7, 0.78]
	],
	'9': [
		[0.3, 0.22],
		[0.7, 0.22],
		[0.3, 0.4],
		[0.7, 0.4],
		[0.5, 0.5],
		[0.3, 0.6],
		[0.7, 0.6],
		[0.3, 0.78],
		[0.7, 0.78]
	],
	T: [
		[0.3, 0.22],
		[0.7, 0.22],
		[0.5, 0.33],
		[0.3, 0.4],
		[0.7, 0.4],
		[0.3, 0.6],
		[0.7, 0.6],
		[0.5, 0.67],
		[0.3, 0.78],
		[0.7, 0.78]
	],
	J: [[0.5, 0.5]],
	Q: [[0.5, 0.5]],
	K: [[0.5, 0.5]],
	A: [[0.5, 0.5]]
};

export function pipLayout(rank: Rank): [number, number][] {
	return PIP_GRID[rank];
}
