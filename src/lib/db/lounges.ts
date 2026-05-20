import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import {
	DEFAULT_LOUNGE_SETTINGS,
	type Database,
	type Lounge,
	type LoungeMemberWithProfile,
	type LoungeSettings
} from '$lib/types';

type DB = SupabaseClient<Database>;

const UNIQUE_VIOLATION = '23505';

function isPostgrestError(e: unknown): e is PostgrestError {
	return !!e && typeof e === 'object' && 'code' in e;
}

export type CreateLoungeInput = {
	name: string;
	persistent: boolean;
	settings: LoungeSettings;
};

export async function createLounge(
	supabase: DB,
	userId: string,
	input: CreateLoungeInput
): Promise<Lounge> {
	// The `code` column has a DB-side default; we just insert and rely on the
	// UNIQUE constraint. If we hit 23505, retry — Postgres re-evaluates the
	// DEFAULT expression on each attempt.
	const MAX_TRIES = 4;
	let lastError: unknown;
	for (let i = 0; i < MAX_TRIES; i++) {
		const { data, error } = await supabase
			.from('lounges')
			.insert({
				name: input.name,
				owner_id: userId,
				persistent: input.persistent,
				settings: input.settings
			})
			.select('*')
			.single();

		if (!error && data) {
			const { error: memberError } = await supabase
				.from('lounge_members')
				.insert({ lounge_id: data.id, user_id: userId, role: 'owner' });
			if (memberError) {
				// Best-effort rollback — RLS allows the owner to delete.
				await supabase.from('lounges').delete().eq('id', data.id);
				throw memberError;
			}
			return data as Lounge;
		}

		lastError = error;
		if (!isPostgrestError(error) || error.code !== UNIQUE_VIOLATION) {
			throw error;
		}
	}
	throw lastError ?? new Error('Failed to create lounge');
}

export async function listMyLounges(
	supabase: DB,
	userId: string
): Promise<Array<Lounge & { member_count: number }>> {
	const { data, error } = await supabase
		.from('lounge_members')
		.select('lounge:lounges(*, lounge_members(count))')
		.eq('user_id', userId);
	if (error) throw error;

	return (data ?? [])
		.map((row) => {
			const lounge = row.lounge as unknown as
				| (Lounge & { lounge_members: { count: number }[] })
				| null;
			if (!lounge) return null;
			const count = lounge.lounge_members?.[0]?.count ?? 0;
			const { lounge_members: _lm, ...rest } = lounge;
			return { ...rest, member_count: count } as Lounge & { member_count: number };
		})
		.filter((l): l is Lounge & { member_count: number } => l !== null)
		.sort(
			(a, b) => new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime()
		);
}

export async function getLounge(supabase: DB, loungeId: string): Promise<Lounge | null> {
	const { data, error } = await supabase
		.from('lounges')
		.select('*')
		.eq('id', loungeId)
		.maybeSingle();
	if (error) throw error;
	return (data as Lounge | null) ?? null;
}

export async function getLoungeMembers(
	supabase: DB,
	loungeId: string
): Promise<LoungeMemberWithProfile[]> {
	const { data, error } = await supabase
		.from('lounge_members')
		.select('lounge_id, user_id, role, joined_at, profile:profiles(display_name, avatar_url)')
		.eq('lounge_id', loungeId)
		.order('joined_at', { ascending: true });
	if (error) throw error;
	return (data ?? []).map((row) => ({
		lounge_id: row.lounge_id as string,
		user_id: row.user_id as string,
		role: row.role as 'owner' | 'member',
		joined_at: row.joined_at as string,
		profile: (Array.isArray(row.profile) ? row.profile[0] : row.profile) ?? {
			display_name: 'Unknown',
			avatar_url: null
		}
	}));
}

export type JoinResult =
	| { ok: true; loungeId: string; alreadyMember: boolean }
	| { ok: false; error: 'not_found' | 'unknown' };

export async function joinByCode(
	supabase: DB,
	userId: string,
	rawCode: string
): Promise<JoinResult> {
	const code = rawCode.trim().toUpperCase();
	if (code.length !== 6) return { ok: false, error: 'not_found' };

	const { data: loungeId, error: rpcError } = await supabase.rpc('lounge_id_by_code', {
		p_code: code
	});
	if (rpcError) return { ok: false, error: 'unknown' };
	if (!loungeId) return { ok: false, error: 'not_found' };

	const { error: insertError } = await supabase
		.from('lounge_members')
		.insert({ lounge_id: loungeId, user_id: userId, role: 'member' });

	if (insertError) {
		if (isPostgrestError(insertError) && insertError.code === UNIQUE_VIOLATION) {
			return { ok: true, loungeId, alreadyMember: true };
		}
		return { ok: false, error: 'unknown' };
	}
	return { ok: true, loungeId, alreadyMember: false };
}

export async function leaveLounge(supabase: DB, userId: string, loungeId: string): Promise<void> {
	const { error } = await supabase
		.from('lounge_members')
		.delete()
		.eq('lounge_id', loungeId)
		.eq('user_id', userId);
	if (error) throw error;
}

export async function deleteLounge(supabase: DB, loungeId: string): Promise<void> {
	const { error } = await supabase.from('lounges').delete().eq('id', loungeId);
	if (error) throw error;
}

export async function updateLoungeSettings(
	supabase: DB,
	loungeId: string,
	patch: { name?: string; persistent?: boolean; settings?: LoungeSettings }
): Promise<Lounge> {
	const { data, error } = await supabase
		.from('lounges')
		.update(patch)
		.eq('id', loungeId)
		.select('*')
		.single();
	if (error) throw error;
	return data as Lounge;
}

export { DEFAULT_LOUNGE_SETTINGS };
