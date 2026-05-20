<script lang="ts">
	type Props = {
		url?: string | null;
		name?: string | null;
		size?: number;
	};

	let { url, name, size = 40 }: Props = $props();

	const initials = $derived(
		(name ?? '')
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((s) => s[0]?.toUpperCase() ?? '')
			.join('') || '?'
	);
</script>

{#if url}
	<img
		src={url}
		alt={name ?? 'avatar'}
		class="rounded-full object-cover"
		style:width="{size}px"
		style:height="{size}px"
		referrerpolicy="no-referrer"
	/>
{:else}
	<span
		class="inline-flex items-center justify-center rounded-full bg-felt-2 font-semibold text-accent"
		style:width="{size}px"
		style:height="{size}px"
		style:font-size="{Math.round(size * 0.4)}px"
	>
		{initials}
	</span>
{/if}
