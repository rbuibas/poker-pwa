import { fail, redirect } from '@sveltejs/kit';
import { joinByCode } from '$lib/db/lounges';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { supabase, user } }) => {
		if (!user) return fail(401, { error: 'Not signed in.' });

		const form = await request.formData();
		const code = ((form.get('code') as string | null) ?? '').trim().toUpperCase();
		if (code.length !== 6) {
			return fail(400, { error: 'Codes are 6 characters.', code });
		}

		const result = await joinByCode(supabase, user.id, code);
		if (!result.ok) {
			return fail(404, {
				error: result.error === 'not_found' ? 'No lounge with that code.' : 'Something went wrong.',
				code
			});
		}
		throw redirect(303, `/lounge/${result.loungeId}`);
	}
};
