/**
 * Pure geometry for laying out seats around an oval poker table.
 *
 * Angle convention: measured from the +x axis with y pointing DOWN (screen
 * coordinates), so 0 = right, π/2 = bottom, π = left, 3π/2 = top.
 */

export interface SeatPosition {
	seatIndex: number;
	x: number;
	y: number;
	angleRad: number;
	size: number;
}

export interface SeatGeometryOpts {
	padding?: number;
	minSize?: number;
	maxSize?: number;
}

const DEFAULTS = { padding: 56, minSize: 56, maxSize: 96 };

function seatSize(totalSeats: number, minSize: number, maxSize: number): number {
	const shrunk = maxSize - Math.max(0, totalSeats - 6) * 12;
	return Math.max(minSize, Math.min(maxSize, shrunk));
}

export function computeSeatPositions(
	totalSeats: number,
	mySeatIndex: number | null,
	ovalWidth: number,
	ovalHeight: number,
	opts: SeatGeometryOpts = {}
): SeatPosition[] {
	if (totalSeats <= 0 || ovalWidth <= 0 || ovalHeight <= 0) return [];

	const padding = opts.padding ?? DEFAULTS.padding;
	const minSize = opts.minSize ?? DEFAULTS.minSize;
	const maxSize = opts.maxSize ?? DEFAULTS.maxSize;

	const cx = ovalWidth / 2;
	const cy = ovalHeight / 2;
	const rx = Math.max(1, ovalWidth / 2 - padding);
	const ry = Math.max(1, ovalHeight / 2 - padding);
	const size = seatSize(totalSeats, minSize, maxSize);

	const positions: SeatPosition[] = new Array(totalSeats);
	const place = (seatIndex: number, angleRad: number): void => {
		positions[seatIndex] = {
			seatIndex,
			x: cx + rx * Math.cos(angleRad),
			y: cy + ry * Math.sin(angleRad),
			angleRad,
			size
		};
	};

	if (mySeatIndex === null || mySeatIndex === undefined) {
		// Spectator: equal spacing around the full ellipse, seat 0 at the bottom.
		const start = Math.PI / 2;
		const step = (2 * Math.PI) / totalSeats;
		for (let i = 0; i < totalSeats; i++) {
			place(i, start + i * step);
		}
		return positions;
	}

	// Seated: my seat at the bottom-center anchor; opponents sweep the long way
	// around (through the top) from bottom-left over to bottom-right.
	place(mySeatIndex, Math.PI / 2);

	if (totalSeats === 1) return positions;

	// Sweep the long way around (through the top). Divide the arc into N equal
	// segments so the (N-1) opponents land at the interior dividers, leaving an
	// equal gap to the bottom anchor on either side.
	const epsilon = Math.PI / (totalSeats * 4);
	const arcStart = Math.PI / 2 + epsilon;
	const arcEnd = Math.PI / 2 + 2 * Math.PI - epsilon;
	const arcSpan = arcEnd - arcStart;
	const step = arcSpan / totalSeats;

	for (let offset = 1; offset < totalSeats; offset++) {
		const seatIdx = (mySeatIndex + offset) % totalSeats;
		const angle = arcStart + offset * step;
		place(seatIdx, angle);
	}
	return positions;
}
