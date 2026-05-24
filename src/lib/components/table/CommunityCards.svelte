<script lang="ts">
	import { fly, scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import type { Card as CardT } from '$lib/realtime/protocol';
	import Card from './Card.svelte';
	import { flyOpts, scaleOpts, flipOpts } from '$lib/motion.svelte';

	interface Props {
		board: CardT[];
		size?: 'sm' | 'md' | 'lg';
	}

	let { board, size = 'md' }: Props = $props();

	const slots = $derived(Array.from({ length: 5 }, (_, i) => ({ key: i, card: board[i] ?? null })));
</script>

<div class="board" role="group" aria-label="Community cards">
	{#each slots as slot, i (slot.key)}
		<div class="slot" animate:flip={flipOpts(220)}>
			{#if slot.card}
				<div class="reveal" in:fly={{ ...flyOpts(-30, 240), delay: i * 60 }}>
					<div in:scale={scaleOpts(0.85, 200)}>
						<Card card={slot.card} {size} />
					</div>
				</div>
			{:else}
				<Card card={null} {size} />
			{/if}
		</div>
	{/each}
</div>

<style>
	.board {
		display: flex;
		gap: 6px;
		align-items: center;
		justify-content: center;
	}
	.slot {
		display: inline-block;
	}
</style>
