import { browser } from '$app/environment';

/**
 * Reactive `prefers-reduced-motion` state. Components can read `motionEnabled()`
 * and feed component params through `withMotion()` so transitions collapse to
 * `duration: 0` when the user has reduced motion enabled.
 */

const state = $state({ reduced: false });

if (browser) {
	const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
	state.reduced = mq.matches;
	mq.addEventListener('change', (e) => {
		state.reduced = e.matches;
	});
}

export function prefersReducedMotion(): boolean {
	return state.reduced;
}

export function motionEnabled(): boolean {
	return !state.reduced;
}

export function withMotion<T extends { duration?: number }>(params: T): T {
	if (state.reduced) {
		return { ...params, duration: 0 };
	}
	return params;
}

export function flyOpts(y = 40, duration = 250) {
	return withMotion({ y, duration });
}

export function scaleOpts(start = 0.85, duration = 200) {
	return withMotion({ start, duration });
}

export function fadeOpts(duration = 200) {
	return withMotion({ duration });
}

export function flipOpts(duration = 300) {
	return withMotion({ duration });
}
