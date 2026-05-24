import { dev } from '$app/environment';
import { prefs } from '$lib/prefs.svelte';

export type SoundName = 'deal' | 'chip' | 'your_turn' | 'win';

/**
 * Sound stub. Real audio comes in a later phase — for now `play()` is a no-op
 * gated by the mute preference. Wired at the call sites so swapping in real
 * playback later only changes this file.
 */
export const sound = {
	play(name: SoundName): void {
		if (prefs.muted) return;
		if (dev) {
			console.debug('[sound]', name);
		}
	}
};
