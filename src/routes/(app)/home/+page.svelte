<script lang="ts">
	import Button from '$lib/components/Button.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Home · Poker Night</title>
</svelte:head>

<header class="mb-6 flex items-end justify-between md:hidden">
	<h1 class="text-2xl font-bold">Your lounges</h1>
	<a href="/profile" class="text-sm text-muted hover:text-text">Profile</a>
</header>

<h1 class="mb-6 hidden text-2xl font-bold md:block">Your lounges</h1>

<div class="mb-6 grid grid-cols-2 gap-3">
	<Button href="/lounge/create" size="lg">Create lounge</Button>
	<Button href="/lounge/join" size="lg" variant="secondary">Join by code</Button>
</div>

{#if data.lounges.length === 0}
	<div class="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
		<p class="mb-2 text-lg">No lounges yet.</p>
		<p class="text-sm text-muted">Create one or join with a 6-character code.</p>
	</div>
{:else}
	<ul class="space-y-3">
		{#each data.lounges as lounge (lounge.id)}
			<li>
				<a
					href="/lounge/{lounge.id}"
					class="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/50 hover:bg-surface-elev"
				>
					<div class="min-w-0 flex-1">
						<div class="mb-1 flex items-center gap-2">
							<h2 class="truncate font-semibold">{lounge.name}</h2>
							<span
								class="shrink-0 rounded-full px-2 py-0.5 text-xs"
								class:bg-accent={lounge.persistent}
								class:text-black={lounge.persistent}
								class:bg-surface-elev={!lounge.persistent}
								class:text-muted={!lounge.persistent}
							>
								{lounge.persistent ? 'Persistent' : 'Ephemeral'}
							</span>
						</div>
						<p class="text-sm text-muted">
							{lounge.member_count}
							{lounge.member_count === 1 ? 'member' : 'members'} · code {lounge.code}
						</p>
					</div>
					<span class="text-accent" aria-hidden="true">→</span>
				</a>
			</li>
		{/each}
	</ul>
{/if}
