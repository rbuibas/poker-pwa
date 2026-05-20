import { fail, redirect } from '@sveltejs/kit';
import { createLounge, DEFAULT_LOUNGE_SETTINGS } from '$lib/db/lounges';
import type { LoungeSettings } from '$lib/types';
import type { Actions } from './$types';

function clampInt(raw: FormDataEntryValue | null, min: number, max: number, fallback: number) {
	const n = Number(raw);
	if (!Number.isFinite(n)) return fallback;
	return Math.min(max, Math.max(min, Math.round(n)));
}

export const actions: Actions = {
	default: async ({ request, locals: { supabase, user } }) => {
		if (!user) return fail(401, { error: 'Not signed in.' });

		const form = await request.formData();
		const name = (form.get('name') as string | null)?.trim() ?? '';
		if (!name) return fail(400, { error: 'Lounge name is required.' });
		if (name.length > 60) return fail(400, { error: 'Lounge name is too long.' });

		const persistent = form.get('persistent') === 'on';

		const settings: LoungeSettings = {
			turn_timer_seconds: clampInt(form.get('turn_timer_seconds'), 10, 120, 30),
			max_players: clampInt(form.get('max_players'), 2, 10, 9),
			small_blind: clampInt(form.get('small_blind'), 1, 100000, 5),
			big_blind: clampInt(form.get('big_blind'), 1, 200000, 10),
			default_buy_in: clampInt(form.get('default_buy_in'), 10, 10000000, 1000)
		};

		if (settings.big_blind < settings.small_blind * 2) {
			return fail(400, {
				error: 'Big blind must be at least 2× the small blind.',
				name,
				persistent,
				...settings
			});
		}

		try {
			const lounge = await createLounge(supabase, user.id, { name, persistent, settings });
			throw redirect(303, `/lounge/${lounge.id}`);
		} catch (e) {
			if (e instanceof Response || (e as { status?: number })?.status === 303) throw e;
			console.error('createLounge failed', e);
			return fail(500, { error: 'Could not create lounge. Try again.' });
		}
	}
};

export const load = () => ({ defaults: DEFAULT_LOUNGE_SETTINGS });
