import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/home';

	if (!code) {
		throw redirect(303, '/?error=auth_failed');
	}

	const { error } = await supabase.auth.exchangeCodeForSession(code);
	if (error) {
		throw redirect(303, '/?error=auth_failed');
	}

	throw redirect(303, next);
};
