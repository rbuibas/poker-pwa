<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { ConnectionStatus } from '$lib/realtime/protocol';
	import { flyOpts } from '$lib/motion.svelte';

	interface Props {
		status: ConnectionStatus;
		onRetry: () => void;
	}

	let { status, onRetry }: Props = $props();

	const visible = $derived(status !== 'connected');
	const label = $derived(
		status === 'connecting'
			? 'Connecting…'
			: status === 'reconnecting'
				? 'Reconnecting…'
				: 'Disconnected'
	);
</script>

{#if visible}
	<div class="banner" class:err={status === 'disconnected'} in:fly={flyOpts(-20, 200)}>
		<span class="dot"></span>
		<span class="lbl">{label}</span>
		{#if status === 'disconnected'}
			<button class="retry" onclick={onRetry}>Tap to retry</button>
		{/if}
	</div>
{/if}

<style>
	.banner {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 6px 12px;
		padding-top: max(6px, env(safe-area-inset-top));
		background: rgba(0, 0, 0, 0.7);
		color: var(--seat-text);
		font-size: 13px;
		font-weight: 600;
		z-index: 40;
	}
	.banner.err {
		background: var(--danger);
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--pot-text);
		box-shadow: 0 0 6px var(--pot-text);
	}
	.banner.err .dot {
		background: #fff;
		box-shadow: none;
	}
	.retry {
		background: rgba(255, 255, 255, 0.15);
		color: #fff;
		border: none;
		min-height: 28px;
		padding: 0 10px;
		border-radius: 6px;
		font-weight: 700;
		cursor: pointer;
	}
</style>
