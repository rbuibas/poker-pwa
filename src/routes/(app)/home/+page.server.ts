import { listMyLounges } from '$lib/db/lounges';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
	if (!user) return { lounges: [] };
	const lounges = await listMyLounges(supabase, user.id);
	return { lounges };
};
