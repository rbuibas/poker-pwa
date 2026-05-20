<script lang="ts">
	let { message }: { message?: string | null } = $props();
</script>

{#if message}
	<p
		class="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
		role="alert"
	>
		{message}
	</p>
{/if}
