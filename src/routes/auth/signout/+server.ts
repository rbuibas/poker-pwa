import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals: { supabase, session } }) => {
	if (session) {
		await supabase.auth.signOut();
	}
	throw redirect(303, '/');
};
