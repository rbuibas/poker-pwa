<script lang="ts">
	let { size = 20 }: { size?: number } = $props();
</script>

<span
	class="inline-block animate-spin rounded-full border-2 border-current border-r-transparent"
	style:width="{size}px"
	style:height="{size}px"
	aria-label="Loading"
	role="status"
></span>
