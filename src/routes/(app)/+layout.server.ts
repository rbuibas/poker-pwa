import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { session, user } }) => {
	if (!session || !user) {
		throw redirect(303, '/');
	}
	return { session, user };
};
