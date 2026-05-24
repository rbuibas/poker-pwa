import { redirect } from '@sveltejs/kit';
import { getLounge, getLoungeMembers } from '$lib/db/lounges';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, user } }) => {
	if (!user) throw redirect(303, '/');

	const lounge = await getLounge(supabase, params.id);
	if (!lounge) throw redirect(303, '/home');

	const members = await getLoungeMembers(supabase, params.id);
	const isMember = members.some((m) => m.user_id === user.id);
	if (!isMember) throw redirect(303, '/home');

	const isOwner = lounge.owner_id === user.id;

	return {
		lounge,
		members,
		isOwner
	};
};
