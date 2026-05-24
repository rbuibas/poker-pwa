<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { Card as CardT } from '$lib/realtime/protocol';
	import Card from './Card.svelte';
	import { flyOpts } from '$lib/motion.svelte';

	interface Props {
		cards: [CardT, CardT] | null;
		faceDown?: boolean;
		size?: 'sm' | 'md' | 'lg';
	}

	let { cards, faceDown = false, size = 'md' }: Props = $props();
</script>

<div class="hole-cards" class:facedown={faceDown}>
	{#if cards}
		<div class="slot rotate-l" in:fly={flyOpts(-30, 220)}>
			<Card card={cards[0]} {faceDown} {size} />
		</div>
		<div class="slot rotate-r" in:fly={{ ...flyOpts(-30, 220), delay: 80 }}>
			<Card card={cards[1]} {faceDown} {size} />
		</div>
	{:else if faceDown}
		<div class="slot rotate-l">
			<Card card={null} faceDown {size} />
		</div>
		<div class="slot rotate-r">
			<Card card={null} faceDown {size} />
		</div>
	{/if}
</div>

<style>
	.hole-cards {
		display: flex;
		gap: 4px;
		align-items: center;
		justify-content: center;
	}
	.slot {
		display: inline-block;
	}
	.rotate-l {
		transform: rotate(-6deg);
	}
	.rotate-r {
		transform: rotate(6deg);
	}
</style>
