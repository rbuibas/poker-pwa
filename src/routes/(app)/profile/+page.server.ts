import { fail } from '@sveltejs/kit';
import { getProfile, updateProfile, uploadAvatar } from '$lib/db/profiles';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
	if (!user) return { profile: null };
	const profile = await getProfile(supabase, user.id);
	return { profile };
};

export const actions: Actions = {
	updateDetails: async ({ request, locals: { supabase, user } }) => {
		if (!user) return fail(401, { error: 'Not signed in.' });
		const form = await request.formData();
		const display_name = (form.get('display_name') as string | null)?.trim() ?? '';
		const bioRaw = (form.get('bio') as string | null) ?? '';
		const bio = bioRaw.trim().slice(0, 200);

		if (!display_name) return fail(400, { error: 'Display name is required.' });
		if (display_name.length > 50) return fail(400, { error: 'Display name is too long.' });

		try {
			await updateProfile(supabase, user.id, { display_name, bio: bio || null });
		} catch (e) {
			console.error('updateProfile failed', e);
			return fail(500, { error: 'Could not save profile.' });
		}
		return { success: true };
	},

	uploadAvatar: async ({ request, locals: { supabase, user } }) => {
		if (!user) return fail(401, { error: 'Not signed in.' });
		const form = await request.formData();
		const file = form.get('avatar');
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'Choose an image to upload.' });
		}

		const result = await uploadAvatar(supabase, user.id, file);
		if (!result.ok) return fail(400, { error: result.error });

		try {
			await updateProfile(supabase, user.id, { avatar_url: result.publicUrl });
		} catch (e) {
			console.error('updateProfile (avatar) failed', e);
			return fail(500, { error: 'Avatar uploaded but profile update failed.' });
		}
		return { success: true, avatar_url: result.publicUrl };
	}
};
