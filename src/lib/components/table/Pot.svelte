<script lang="ts">
	import { Tween } from 'svelte/motion';
	import type { Pot } from '$lib/realtime/protocol';
	import { motionEnabled } from '$lib/motion.svelte';

	interface Props {
		pots: Pot[];
		// Total includes bets currently in front of seats (driven by the store).
		total: number;
	}

	let { pots, total }: Props = $props();

	const display = new Tween(0, { duration: 0 });

	$effect(() => {
		display.set(total, { duration: motionEnabled() ? 400 : 0 });
	});

	const rounded = $derived(Math.round(display.current));
	const sidePots = $derived(pots.slice(1));
</script>

<div class="pot" aria-live="polite">
	<div class="label">Pot</div>
	<div class="amount">{rounded.toLocaleString()}</div>
	{#if sidePots.length > 0}
		<div class="side-pots">
			{#each sidePots as p, i (i)}
				<div class="side">Side: {p.amount.toLocaleString()}</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.pot {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		color: var(--pot-text);
		font-family: ui-sans-serif, system-ui, sans-serif;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}
	.label {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--seat-text-dim);
	}
	.amount {
		font-size: 22px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.side-pots {
		display: flex;
		gap: 8px;
		font-size: 11px;
		color: var(--seat-text-dim);
	}
</style>
