import { error, fail, redirect } from '@sveltejs/kit';
import {
	deleteLounge,
	getLounge,
	getLoungeMembers,
	leaveLounge,
	updateLoungeSettings
} from '$lib/db/lounges';
import type { LoungeSettings } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, user } }) => {
	if (!user) throw redirect(303, '/');

	const lounge = await getLounge(supabase, params.id);
	if (!lounge) {
		// RLS hides lounges the user isn't a member of — surface as "not found".
		throw redirect(303, '/home');
	}

	const members = await getLoungeMembers(supabase, params.id);
	const isMember = members.some((m) => m.user_id === user.id);
	if (!isMember) throw redirect(303, '/home');

	const isOwner = lounge.owner_id === user.id;
	return { lounge, members, isOwner };
};

function clampInt(raw: FormDataEntryValue | null, min: number, max: number, fallback: number) {
	const n = Number(raw);
	if (!Number.isFinite(n)) return fallback;
	return Math.min(max, Math.max(min, Math.round(n)));
}

export const actions: Actions = {
	leave: async ({ params, locals: { supabase, user } }) => {
		if (!user) return fail(401, { error: 'Not signed in.' });
		const lounge = await getLounge(supabase, params.id);
		if (lounge && lounge.owner_id === user.id) {
			return fail(400, { error: 'Owners must delete the lounge instead of leaving.' });
		}
		try {
			await leaveLounge(supabase, user.id, params.id);
		} catch (e) {
			console.error('leaveLounge failed', e);
			return fail(500, { error: 'Could not leave lounge.' });
		}
		throw redirect(303, '/home');
	},

	delete: async ({ params, locals: { supabase, user } }) => {
		if (!user) return fail(401, { error: 'Not signed in.' });
		const lounge = await getLounge(supabase, params.id);
		if (!lounge) throw error(404, 'Lounge not found');
		if (lounge.owner_id !== user.id) return fail(403, { error: 'Only the owner can delete.' });
		try {
			await deleteLounge(supabase, params.id);
		} catch (e) {
			console.error('deleteLounge failed', e);
			return fail(500, { error: 'Could not delete lounge.' });
		}
		throw redirect(303, '/home');
	},

	updateSettings: async ({ request, params, locals: { supabase, user } }) => {
		if (!user) return fail(401, { error: 'Not signed in.' });
		const lounge = await getLounge(supabase, params.id);
		if (!lounge) throw error(404, 'Lounge not found');
		if (lounge.owner_id !== user.id) return fail(403, { error: 'Only the owner can edit.' });

		const form = await request.formData();
		const name = (form.get('name') as string | null)?.trim() ?? lounge.name;
		const persistent = form.get('persistent') === 'on';

		const settings: LoungeSettings = {
			turn_timer_seconds: clampInt(
				form.get('turn_timer_seconds'),
				10,
				120,
				lounge.settings.turn_timer_seconds
			),
			max_players: clampInt(form.get('max_players'), 2, 10, lounge.settings.max_players),
			small_blind: clampInt(form.get('small_blind'), 1, 100000, lounge.settings.small_blind),
			big_blind: clampInt(form.get('big_blind'), 1, 200000, lounge.settings.big_blind),
			default_buy_in: clampInt(
				form.get('default_buy_in'),
				10,
				10000000,
				lounge.settings.default_buy_in
			)
		};

		if (settings.big_blind < settings.small_blind * 2) {
			return fail(400, { error: 'Big blind must be at least 2× the small blind.' });
		}

		try {
			await updateLoungeSettings(supabase, params.id, { name, persistent, settings });
		} catch (e) {
			console.error('updateLoungeSettings failed', e);
			return fail(500, { error: 'Could not save settings.' });
		}
		return { success: true };
	}
};
