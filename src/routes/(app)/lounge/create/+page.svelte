<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/Button.svelte';
	import FormError from '$lib/components/FormError.svelte';

	let { data, form } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Create lounge · Poker Night</title>
</svelte:head>

<header class="mb-6">
	<a href="/home" class="text-sm text-muted hover:text-text">← Back</a>
	<h1 class="mt-2 text-2xl font-bold">Create a lounge</h1>
</header>

<form
	method="POST"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	}}
	class="space-y-5"
>
	<div class="rounded-xl border border-border bg-surface p-5">
		<label for="name" class="mb-1 block text-sm font-medium">Lounge name</label>
		<input
			id="name"
			name="name"
			required
			maxlength="60"
			placeholder="Friday Night Poker"
			class="w-full rounded-lg border border-border bg-bg px-3 py-3 text-base focus:border-accent focus:outline-none"
		/>

		<label class="mt-4 flex items-center gap-3">
			<input type="checkbox" name="persistent" class="h-5 w-5 accent-[var(--color-accent)]" />
			<span>
				<span class="block font-medium">Persistent</span>
				<span class="block text-xs text-muted">
					Persistent lounges stick around. Ephemeral ones disappear when the game ends.
				</span>
			</span>
		</label>
	</div>

	<div class="space-y-4 rounded-xl border border-border bg-surface p-5">
		<h2 class="text-sm font-semibold text-muted uppercase">House rules</h2>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="turn_timer_seconds" class="mb-1 block text-sm font-medium">
					Turn timer (sec)
				</label>
				<input
					id="turn_timer_seconds"
					name="turn_timer_seconds"
					type="number"
					min="10"
					max="120"
					value={data.defaults.turn_timer_seconds}
					inputmode="numeric"
					class="w-full rounded-lg border border-border bg-bg px-3 py-3 focus:border-accent focus:outline-none"
				/>
			</div>

			<div>
				<label for="max_players" class="mb-1 block text-sm font-medium">Max players</label>
				<input
					id="max_players"
					name="max_players"
					type="number"
					min="2"
					max="10"
					value={data.defaults.max_players}
					inputmode="numeric"
					class="w-full rounded-lg border border-border bg-bg px-3 py-3 focus:border-accent focus:outline-none"
				/>
			</div>

			<div>
				<label for="small_blind" class="mb-1 block text-sm font-medium">Small blind</label>
				<input
					id="small_blind"
					name="small_blind"
					type="number"
					min="1"
					value={data.defaults.small_blind}
					inputmode="numeric"
					class="w-full rounded-lg border border-border bg-bg px-3 py-3 focus:border-accent focus:outline-none"
				/>
			</div>

			<div>
				<label for="big_blind" class="mb-1 block text-sm font-medium">Big blind</label>
				<input
					id="big_blind"
					name="big_blind"
					type="number"
					min="1"
					value={data.defaults.big_blind}
					inputmode="numeric"
					class="w-full rounded-lg border border-border bg-bg px-3 py-3 focus:border-accent focus:outline-none"
				/>
			</div>

			<div class="col-span-2">
				<label for="default_buy_in" class="mb-1 block text-sm font-medium">Default buy-in</label>
				<input
					id="default_buy_in"
					name="default_buy_in"
					type="number"
					min="10"
					value={data.defaults.default_buy_in}
					inputmode="numeric"
					class="w-full rounded-lg border border-border bg-bg px-3 py-3 focus:border-accent focus:outline-none"
				/>
			</div>
		</div>
	</div>

	<FormError message={form?.error} />

	<Button type="submit" loading={submitting} size="lg" class="w-full">Create lounge</Button>
</form>
