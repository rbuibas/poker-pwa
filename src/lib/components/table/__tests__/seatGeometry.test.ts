import { describe, it, expect } from 'vitest';
import { computeSeatPositions } from '../seatGeometry';

const W = 800;
const H = 500;
const cx = W / 2;
const cy = H / 2;

function near(a: number, b: number, eps = 0.01): boolean {
	return Math.abs(a - b) < eps;
}

describe('computeSeatPositions', () => {
	it('N=2, mySeat=0: me at bottom, opponent at top', () => {
		const seats = computeSeatPositions(2, 0, W, H);
		expect(seats).toHaveLength(2);

		const me = seats[0];
		expect(me.seatIndex).toBe(0);
		expect(near(me.angleRad, Math.PI / 2)).toBe(true);
		expect(me.x).toBeCloseTo(cx, 1);
		expect(me.y).toBeGreaterThan(cy);

		const opp = seats[1];
		expect(opp.seatIndex).toBe(1);
		expect(near(opp.angleRad, (3 * Math.PI) / 2)).toBe(true);
		expect(opp.x).toBeCloseTo(cx, 1);
		expect(opp.y).toBeLessThan(cy);
	});

	it('N=6, mySeat=2: 6 entries, mine at bottom, all size 96', () => {
		const seats = computeSeatPositions(6, 2, W, H);
		expect(seats).toHaveLength(6);

		const me = seats[2];
		expect(near(me.angleRad, Math.PI / 2)).toBe(true);
		expect(me.x).toBeCloseTo(cx, 1);

		for (const s of seats) {
			expect(s.size).toBe(96);
		}

		const seatIndices = seats.map((s) => s.seatIndex).sort((a, b) => a - b);
		expect(seatIndices).toEqual([0, 1, 2, 3, 4, 5]);
	});

	it('N=9, mySeat=4: 9 distinct angles, all sizes 60', () => {
		const seats = computeSeatPositions(9, 4, W, H);
		expect(seats).toHaveLength(9);

		for (const s of seats) {
			expect(s.size).toBe(60);
		}

		const angles = seats.map((s) => s.angleRad);
		const unique = new Set(angles.map((a) => a.toFixed(4)));
		expect(unique.size).toBe(9);
	});

	it('N=10 spectator (mySeatIndex=null): equal spacing, seat 0 at bottom, sizes 56', () => {
		const seats = computeSeatPositions(10, null, W, H);
		expect(seats).toHaveLength(10);

		const seat0 = seats[0];
		expect(near(seat0.angleRad, Math.PI / 2)).toBe(true);

		for (const s of seats) {
			expect(s.size).toBe(56);
		}

		// equal spacing → step = 2π/10
		const step = (2 * Math.PI) / 10;
		for (let i = 0; i < 10; i++) {
			const expected = Math.PI / 2 + i * step;
			expect(seats[i].angleRad).toBeCloseTo(expected, 4);
		}
	});

	it('N=3, mySeat=0: opponents are symmetric about the vertical axis', () => {
		const seats = computeSeatPositions(3, 0, W, H);
		const a = seats[1];
		const b = seats[2];
		// Same y, mirrored x around cx.
		expect(a.y).toBeCloseTo(b.y, 1);
		expect(a.x - cx).toBeCloseTo(-(b.x - cx), 1);
	});

	it('returns empty for degenerate inputs', () => {
		expect(computeSeatPositions(0, 0, W, H)).toEqual([]);
		expect(computeSeatPositions(6, 0, 0, H)).toEqual([]);
		expect(computeSeatPositions(6, 0, W, 0)).toEqual([]);
	});
});
