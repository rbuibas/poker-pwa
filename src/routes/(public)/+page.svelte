<script lang="ts">
	import { page } from '$app/state';
	import Spinner from '$lib/components/Spinner.svelte';

	let { data } = $props();
	let loading = $state(false);
	let error = $state<string | null>(null);

	const errorFromQuery = $derived(page.url.searchParams.get('error'));

	async function signInWithGoogle() {
		loading = true;
		error = null;
		const redirectTo = `${window.location.origin}/auth/callback`;
		const { error: signInError } = await data.supabase.auth.signInWithOAuth({
			provider: 'google',
			options: { redirectTo }
		});
		if (signInError) {
			error = signInError.message;
			loading = false;
		}
		// On success the browser redirects to Google — no local cleanup needed.
	}
</script>

<svelte:head>
	<title>Poker Night</title>
</svelte:head>

<main class="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
	<div class="w-full max-w-sm">
		<div class="mb-12 text-center">
			<div
				class="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-felt-2 text-5xl text-accent"
				aria-hidden="true"
			>
				♠
			</div>
			<h1 class="text-3xl font-bold tracking-tight">Poker Night</h1>
			<p class="mt-2 text-sm text-muted">Texas Hold’em with your friends. No money. Just fun.</p>
		</div>

		{#if errorFromQuery === 'auth_failed'}
			<p
				class="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
				role="alert"
			>
				Sign-in failed. Please try again.
			</p>
		{/if}

		{#if error}
			<p
				class="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
				role="alert"
			>
				{error}
			</p>
		{/if}

		<button
			class="inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-white px-6 font-medium text-black transition-colors hover:bg-neutral-100 disabled:opacity-60"
			onclick={signInWithGoogle}
			disabled={loading}
		>
			{#if loading}
				<Spinner size={18} />
				Signing in…
			{:else}
				<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
					<path
						fill="#EA4335"
						d="M12 11v3.2h7.5c-.3 1.6-1.3 3-2.7 3.9l4.4 3.4c2.6-2.4 4-5.9 4-9.7 0-.9-.1-1.7-.2-2.5H12z"
					/>
					<path
						fill="#34A853"
						d="M5.5 14.3l-1 .8L1 17.6C2.9 21.4 7.1 24 12 24c3.2 0 5.8-1 7.8-2.8l-4.4-3.4c-1.1.7-2.5 1.2-3.4 1.2-2.8 0-5.2-1.9-6-4.5"
					/>
					<path
						fill="#FBBC05"
						d="M1 6.4C-.1 8.7-.1 11.3 1 13.6l4.5-3.4c-.3-.9-.3-1.9 0-2.8z"
					/>
					<path
						fill="#4285F4"
						d="M12 4.8c1.7 0 3.3.6 4.5 1.7l3.4-3.4C17.8 1.2 15.1 0 12 0 7.1 0 2.9 2.6 1 6.4l4.5 3.5C6.4 7 8.9 4.8 12 4.8"
					/>
				</svg>
				Continue with Google
			{/if}
		</button>

		<p class="mt-8 text-center text-xs text-muted">
			Fictive chips only. No real money is ever exchanged.
		</p>
	</div>
</main>
