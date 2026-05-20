<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/Button.svelte';
	import FormError from '$lib/components/FormError.svelte';

	let { form } = $props();
	let submitting = $state(false);
	let code = $state('');

	function onInput(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		const upper = target.value.toUpperCase();
		target.value = upper;
		code = upper;
	}
</script>

<svelte:head>
	<title>Join lounge · Poker Night</title>
</svelte:head>

<header class="mb-6">
	<a href="/home" class="text-sm text-muted hover:text-text">← Back</a>
	<h1 class="mt-2 text-2xl font-bold">Join a lounge</h1>
	<p class="mt-1 text-sm text-muted">Enter the 6-character code your friend shared.</p>
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
	class="space-y-4"
>
	<div class="rounded-xl border border-border bg-surface p-5">
		<label for="code" class="mb-2 block text-sm font-medium">Code</label>
		<input
			id="code"
			name="code"
			value={form && 'code' in form ? (form.code as string) : ''}
			oninput={onInput}
			required
			maxlength="6"
			minlength="6"
			autocapitalize="characters"
			autocomplete="off"
			spellcheck="false"
			placeholder="ABC123"
			class="w-full rounded-lg border border-border bg-bg px-4 py-4 text-center font-mono text-2xl tracking-[0.5em] uppercase focus:border-accent focus:outline-none"
		/>
	</div>

	<FormError message={form?.error} />

	<Button type="submit" loading={submitting} size="lg" class="w-full" disabled={code.length !== 6}>
		Join
	</Button>
</form>
