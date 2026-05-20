import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Profile } from '$lib/types';

type DB = SupabaseClient<Database>;

export async function getProfile(supabase: DB, userId: string): Promise<Profile | null> {
	const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
	if (error) {
		if (error.code === 'PGRST116') return null; // no rows
		throw error;
	}
	return data;
}

export async function updateProfile(
	supabase: DB,
	userId: string,
	patch: { display_name?: string; bio?: string | null; avatar_url?: string | null }
): Promise<Profile> {
	const { data, error } = await supabase
		.from('profiles')
		.update(patch)
		.eq('id', userId)
		.select('*')
		.single();
	if (error) throw error;
	return data;
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 2 * 1024 * 1024;

export type AvatarUploadResult =
	| { ok: true; publicUrl: string }
	| { ok: false; error: string };

export async function uploadAvatar(
	supabase: DB,
	userId: string,
	file: File
): Promise<AvatarUploadResult> {
	if (!ALLOWED_MIME.has(file.type)) {
		return { ok: false, error: 'Use a JPG, PNG, or WebP image.' };
	}
	if (file.size > MAX_BYTES) {
		return { ok: false, error: 'Image must be under 2 MB.' };
	}

	const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
	const path = `${userId}/avatar.${ext}`;

	const { error: uploadError } = await supabase.storage
		.from('avatars')
		.upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });

	if (uploadError) return { ok: false, error: uploadError.message };

	const { data } = supabase.storage.from('avatars').getPublicUrl(path);
	// Append a cache-buster so clients see the new image after upsert.
	const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
	return { ok: true, publicUrl };
}
