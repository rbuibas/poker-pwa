<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/Avatar.svelte';
	import Button from '$lib/components/Button.svelte';
	import FormError from '$lib/components/FormError.svelte';

	let { data, form } = $props();

	let editing = $state(false);
	let saving = $state(false);
	let leaving = $state(false);
	let deleting = $state(false);
	let confirmDelete = $state(false);
	let copied = $state(false);

	async function copyCode() {
		try {
			await navigator.clipboard.writeText(data.lounge.code);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {
			/* ignore */
		}
	}
</script>

<svelte:head>
	<title>{data.lounge.name} · Poker Night</title>
</svelte:head>

<header class="mb-6">
	<a href="/home" class="text-sm text-muted hover:text-text">← Lounges</a>
	<div class="mt-2 flex items-start justify-between gap-3">
		<div class="min-w-0">
			<h1 class="truncate text-2xl font-bold">{data.lounge.name}</h1>
			<div class="mt-1 flex items-center gap-2">
				<span
					class="rounded-full px-2 py-0.5 text-xs"
					class:bg-accent={data.lounge.persistent}
					class:text-black={data.lounge.persistent}
					class:bg-surface-elev={!data.lounge.persistent}
					class:text-muted={!data.lounge.persistent}
				>
					{data.lounge.persistent ? 'Persistent' : 'Ephemeral'}
				</span>
				{#if data.isOwner}
					<span class="rounded-full bg-felt-2 px-2 py-0.5 text-xs text-accent">Owner</span>
				{/if}
			</div>
		</div>
	</div>
</header>

<section class="mb-6 rounded-xl border border-border bg-surface p-5">
	<p class="mb-2 text-xs font-semibold text-muted uppercase">Join code</p>
	<div class="flex items-center justify-between gap-3">
		<span class="font-mono text-3xl tracking-[0.4em] text-accent">{data.lounge.code}</span>
		<button
			class="rounded-lg border border-border bg-surface-elev px-3 py-2 text-sm font-medium hover:bg-[#272c27]"
			onclick={copyCode}
		>
			{copied ? 'Copied!' : 'Copy'}
		</button>
	</div>
	<p class="mt-2 text-xs text-muted">Share this code with friends so they can join.</p>
</section>

<section class="mb-6 rounded-xl border border-dashed border-border bg-surface/60 p-5">
	<div class="flex items-center justify-between">
		<div>
			<p class="font-semibold">Start game</p>
			<p class="text-xs text-muted">Coming soon — the poker engine isn’t built yet.</p>
		</div>
		<Button disabled size="md" title="Coming soon">Start</Button>
	</div>
</section>

<section class="mb-6 rounded-xl border border-border bg-surface p-5">
	<h2 class="mb-3 font-semibold">
		Members <span class="text-muted">({data.members.length})</span>
	</h2>
	<ul class="space-y-3">
		{#each data.members as m (m.user_id)}
			<li class="flex items-center gap-3">
				<Avatar url={m.profile.avatar_url} name={m.profile.display_name} size={40} />
				<div class="min-w-0 flex-1">
					<p class="truncate font-medium">{m.profile.display_name}</p>
					<p class="text-xs text-muted">{m.role === 'owner' ? 'Owner' : 'Member'}</p>
				</div>
			</li>
		{/each}
	</ul>
</section>

<section class="mb-6 rounded-xl border border-border bg-surface p-5">
	<div class="mb-3 flex items-center justify-between">
		<h2 class="font-semibold">Settings</h2>
		{#if data.isOwner && !editing}
			<button class="text-sm text-accent hover:underline" onclick={() => (editing = true)}>
				Edit
			</button>
		{/if}
	</div>

	{#if !editing}
		<dl class="grid grid-cols-2 gap-y-2 text-sm">
			<dt class="text-muted">Turn timer</dt>
			<dd class="text-right">{data.lounge.settings.turn_timer_seconds}s</dd>
			<dt class="text-muted">Max players</dt>
			<dd class="text-right">{data.lounge.settings.max_players}</dd>
			<dt class="text-muted">Blinds</dt>
			<dd class="text-right">
				{data.lounge.settings.small_blind} / {data.lounge.settings.big_blind}
			</dd>
			<dt class="text-muted">Default buy-in</dt>
			<dd class="text-right">{data.lounge.settings.default_buy_in}</dd>
		</dl>
	{:else}
		<form
			method="POST"
			action="?/updateSettings"
			use:enhance={() => {
				saving = true;
				return async ({ update }) => {
					await update();
					saving = false;
					editing = false;
				};
			}}
			class="space-y-4"
		>
			<div>
				<label for="name" class="mb-1 block text-sm font-medium">Name</label>
				<input
					id="name"
					name="name"
					required
					maxlength="60"
					value={data.lounge.name}
					class="w-full rounded-lg border border-border bg-bg px-3 py-3 focus:border-accent focus:outline-none"
				/>
			</div>
			<label class="flex items-center gap-3">
				<input
					type="checkbox"
					name="persistent"
					checked={data.lounge.persistent}
					class="h-5 w-5 accent-[var(--color-accent)]"
				/>
				<span class="font-medium">Persistent</span>
			</label>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="turn_timer_seconds" class="mb-1 block text-sm">Turn timer (sec)</label>
					<input
						id="turn_timer_seconds"
						name="turn_timer_seconds"
						type="number"
						min="10"
						max="120"
						value={data.lounge.settings.turn_timer_seconds}
						class="w-full rounded-lg border border-border bg-bg px-3 py-3 focus:border-accent focus:outline-none"
					/>
				</div>
				<div>
					<label for="max_players" class="mb-1 block text-sm">Max players</label>
					<input
						id="max_players"
						name="max_players"
						type="number"
						min="2"
						max="10"
						value={data.lounge.settings.max_players}
						class="w-full rounded-lg border border-border bg-bg px-3 py-3 focus:border-accent focus:outline-none"
					/>
				</div>
				<div>
					<label for="small_blind" class="mb-1 block text-sm">Small blind</label>
					<input
						id="small_blind"
						name="small_blind"
						type="number"
						min="1"
						value={data.lounge.settings.small_blind}
						class="w-full rounded-lg border border-border bg-bg px-3 py-3 focus:border-accent focus:outline-none"
					/>
				</div>
				<div>
					<label for="big_blind" class="mb-1 block text-sm">Big blind</label>
					<input
						id="big_blind"
						name="big_blind"
						type="number"
						min="1"
						value={data.lounge.settings.big_blind}
						class="w-full rounded-lg border border-border bg-bg px-3 py-3 focus:border-accent focus:outline-none"
					/>
				</div>
				<div class="col-span-2">
					<label for="default_buy_in" class="mb-1 block text-sm">Default buy-in</label>
					<input
						id="default_buy_in"
						name="default_buy_in"
						type="number"
						min="10"
						value={data.lounge.settings.default_buy_in}
						class="w-full rounded-lg border border-border bg-bg px-3 py-3 focus:border-accent focus:outline-none"
					/>
				</div>
			</div>

			<FormError message={form?.error} />

			<div class="flex justify-end gap-2">
				<Button variant="ghost" onclick={() => (editing = false)} type="button">Cancel</Button>
				<Button type="submit" loading={saving}>Save</Button>
			</div>
		</form>
	{/if}
</section>

<section class="rounded-xl border border-border bg-surface p-5">
	<h2 class="mb-3 font-semibold">Membership</h2>
	{#if data.isOwner}
		{#if !confirmDelete}
			<Button variant="danger" onclick={() => (confirmDelete = true)} class="w-full">
				Delete lounge
			</Button>
		{:else}
			<p class="mb-3 text-sm text-danger">
				Deleting removes this lounge and its membership for everyone.
			</p>
			<div class="grid grid-cols-2 gap-2">
				<Button variant="ghost" onclick={() => (confirmDelete = false)}>Cancel</Button>
				<form
					method="POST"
					action="?/delete"
					use:enhance={() => {
						deleting = true;
						return async ({ update }) => {
							await update();
							deleting = false;
						};
					}}
				>
					<Button type="submit" variant="danger" loading={deleting} class="w-full">
						Yes, delete
					</Button>
				</form>
			</div>
		{/if}
	{:else}
		<form
			method="POST"
			action="?/leave"
			use:enhance={() => {
				leaving = true;
				return async ({ update }) => {
					await update();
					leaving = false;
				};
			}}
		>
			<Button type="submit" variant="secondary" loading={leaving} class="w-full">
				Leave lounge
			</Button>
		</form>
	{/if}
</section>
