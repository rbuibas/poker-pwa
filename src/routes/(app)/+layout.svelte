<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';
	import TopNav from '$lib/components/TopNav.svelte';

	let { children } = $props();
</script>

<div class="flex min-h-dvh flex-col">
	<TopNav />
	<main class="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-24 md:pb-12">
		{@render children()}
	</main>
	<BottomNav />
</div>
