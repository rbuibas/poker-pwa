<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import type { TableConfig } from '$lib/realtime/protocol';
	import { fadeOpts, scaleOpts } from '$lib/motion.svelte';

	interface Props {
		seat: number;
		config: TableConfig;
		onConfirm: (buyIn: number) => void;
		onCancel: () => void;
	}

	let { seat, config, onConfirm, onCancel }: Props = $props();

	const step = $derived(Math.max(1, config.bigBlind * 2));
	let amount = $state(0);

	$effect(() => {
		if (amount === 0) amount = config.defaultBuyIn;
	});

	function clamp(v: number): number {
		return Math.max(config.minBuyIn, Math.min(config.maxBuyIn, Math.round(v)));
	}

	function setAmount(v: number): void {
		amount = clamp(v);
	}

	function confirm(): void {
		onConfirm(clamp(amount));
	}
</script>

<div class="overlay" transition:fade={fadeOpts(150)} role="dialog" aria-modal="true">
	<div class="modal" in:scale={scaleOpts(0.9, 200)}>
		<header>
			<h2>Sit at seat {seat + 1}</h2>
			<button class="x" onclick={onCancel} aria-label="Cancel">×</button>
		</header>
		<div class="body">
			<label>
				<span class="lbl">Buy-in</span>
				<input
					type="range"
					min={config.minBuyIn}
					max={config.maxBuyIn}
					{step}
					bind:value={amount}
				/>
			</label>
			<input
				class="num"
				type="number"
				min={config.minBuyIn}
				max={config.maxBuyIn}
				{step}
				value={amount}
				oninput={(e) => setAmount(Number((e.target as HTMLInputElement).value))}
			/>
			<div class="hint">
				Min {config.minBuyIn.toLocaleString()} · Max {config.maxBuyIn.toLocaleString()}
			</div>
		</div>
		<footer>
			<button class="btn ghost" onclick={onCancel}>Cancel</button>
			<button class="btn primary" onclick={confirm}>
				Sit down · {amount.toLocaleString()}
			</button>
		</footer>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: grid;
		place-items: center;
		z-index: 60;
	}
	.modal {
		background: var(--seat-bg);
		color: var(--seat-text);
		border: 1px solid var(--seat-border);
		border-radius: var(--radius-md);
		width: min(420px, 92vw);
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	h2 {
		font-size: 16px;
		font-weight: 700;
	}
	.x {
		background: transparent;
		color: var(--seat-text-dim);
		border: none;
		font-size: 22px;
		line-height: 1;
		cursor: pointer;
		padding: 4px 8px;
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.lbl {
		font-size: 12px;
		color: var(--seat-text-dim);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	input[type='range'] {
		width: 100%;
		accent-color: var(--accent);
	}
	.num {
		min-height: 44px;
		padding: 0 12px;
		background: var(--table-bg);
		color: var(--seat-text);
		border: 1px solid var(--seat-border);
		border-radius: 8px;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		text-align: right;
	}
	.hint {
		font-size: 12px;
		color: var(--seat-text-dim);
	}
	footer {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}
	.btn {
		min-height: 44px;
		padding: 0 16px;
		border-radius: var(--radius-md);
		font-weight: 700;
		cursor: pointer;
		border: none;
	}
	.btn.primary {
		background: var(--accent);
		color: var(--btn-text);
	}
	.btn.ghost {
		background: transparent;
		color: var(--seat-text);
		border: 1px solid var(--seat-border);
	}
</style>
