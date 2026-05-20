<script lang="ts">
	import './layout.css';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data, children } = $props();
	let { session, supabase } = $derived(data);

	onMount(() => {
		const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});
		return () => subscription.subscription.unsubscribe();
	});
</script>

<svelte:head>
	<title>Poker Night</title>
</svelte:head>

{@render children()}
