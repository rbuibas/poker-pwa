<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flyOpts } from '$lib/motion.svelte';

	interface Props {
		amount: number;
	}

	let { amount }: Props = $props();
</script>

{#if amount > 0}
	<div class="chip-stack" in:fly={flyOpts(10, 180)}>
		<span class="chip"></span>
		<span class="chip"></span>
		<span class="amount">{amount.toLocaleString()}</span>
	</div>
{/if}

<style>
	.chip-stack {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 3px 8px;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.4);
		color: var(--seat-text);
		font-size: 12px;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}
	.chip {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--bet-chip);
		box-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
	}
	.chip + .chip {
		margin-left: -6px;
	}
	.amount {
		margin-left: 2px;
	}
</style>
