<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { LegalActions, PlayerAction, Pot, PublicPlayer } from '$lib/realtime/protocol';
	import { computePresets, sliderBounds } from './betMath';
	import { flyOpts } from '$lib/motion.svelte';

	interface Props {
		legalActions: LegalActions;
		pots: Pot[];
		players: PublicPlayer[];
		myPlayer: PublicPlayer;
		currentBet: number;
		bigBlind: number;
		onAction: (action: PlayerAction) => void;
	}

	let { legalActions, pots, players, myPlayer, currentBet, bigBlind, onAction }: Props = $props();

	const bounds = $derived(sliderBounds(legalActions, bigBlind));
	const presets = $derived(
		computePresets({
			pots,
			players,
			myCurrentBet: myPlayer.currentBet,
			myStack: myPlayer.stack,
			currentBet,
			bigBlind,
			legalActions
		})
	);

	let sliderValue = $state(0);
	let lastBoundsKey = $state('');

	$effect(() => {
		if (!bounds) return;
		const key = `${bounds.min}|${bounds.max}|${bounds.step}`;
		if (key !== lastBoundsKey) {
			sliderValue = bounds.min;
			lastBoundsKey = key;
		}
	});

	const raiseMode = $derived(legalActions.canRaise);
	const betLabel = $derived(raiseMode ? 'Raise to' : 'Bet');

	function applyPreset(amount: number): void {
		sliderValue = amount;
	}

	function handleNumeric(e: Event): void {
		const v = Number((e.target as HTMLInputElement).value);
		if (!bounds || !Number.isFinite(v)) return;
		sliderValue = Math.max(bounds.min, Math.min(bounds.max, Math.round(v)));
	}

	function confirmBet(): void {
		if (!bounds) return;
		const type = raiseMode ? 'raise' : 'bet';
		onAction({ type, amount: sliderValue });
	}
</script>

<div class="bar" in:fly={flyOpts(20, 200)} role="group" aria-label="Your actions">
	<div class="left">
		{#if legalActions.canFold}
			<button class="btn fold" onclick={() => onAction({ type: 'fold' })}>Fold</button>
		{/if}
	</div>

	<div class="middle">
		{#if legalActions.canCheck}
			<button class="btn check" onclick={() => onAction({ type: 'check' })}>Check</button>
		{:else if legalActions.canCall}
			<button class="btn check" onclick={() => onAction({ type: 'call' })}>
				Call {legalActions.callAmount.toLocaleString()}
			</button>
		{/if}
	</div>

	<div class="right">
		{#if bounds}
			<div class="presets" role="group" aria-label="Bet presets">
				{#if presets.half}
					<button class="preset" onclick={() => applyPreset(presets.half!.amount)}>
						{presets.half.label}
					</button>
				{/if}
				{#if presets.threeQuarter}
					<button class="preset" onclick={() => applyPreset(presets.threeQuarter!.amount)}>
						{presets.threeQuarter.label}
					</button>
				{/if}
				{#if presets.pot}
					<button class="preset" onclick={() => applyPreset(presets.pot!.amount)}>
						{presets.pot.label}
					</button>
				{/if}
				{#if presets.allIn}
					<button class="preset" onclick={() => applyPreset(presets.allIn!.amount)}>
						{presets.allIn.label}
					</button>
				{/if}
			</div>
			<div class="slider-row">
				<input
					type="range"
					min={bounds.min}
					max={bounds.max}
					step={bounds.step}
					bind:value={sliderValue}
					aria-label="Bet amount"
				/>
				<input
					type="number"
					class="amount"
					min={bounds.min}
					max={bounds.max}
					step={bounds.step}
					value={sliderValue}
					oninput={handleNumeric}
					aria-label="Bet amount (numeric)"
				/>
			</div>
			<button
				class="btn raise"
				disabled={sliderValue < bounds.min || sliderValue > bounds.max}
				onclick={confirmBet}
			>
				{betLabel}
				{sliderValue.toLocaleString()}
			</button>
		{/if}
	</div>
</div>

<style>
	.bar {
		display: grid;
		grid-template-columns: 1fr 1fr 2fr;
		gap: 12px;
		align-items: stretch;
		padding: 10px 12px;
		padding-bottom: max(10px, env(safe-area-inset-bottom));
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(6px);
		border-top: 1px solid var(--seat-border);
	}
	.left,
	.middle {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.right {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}
	.btn {
		min-height: 44px;
		padding: 0 16px;
		border-radius: var(--radius-md);
		font-weight: 700;
		font-size: 15px;
		color: var(--btn-text);
		border: none;
		cursor: pointer;
		width: 100%;
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.fold {
		background: var(--btn-fold);
	}
	.check {
		background: var(--btn-check-call);
	}
	.raise {
		background: var(--btn-bet-raise);
	}
	.presets {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px;
	}
	.preset {
		min-height: 36px;
		border-radius: 8px;
		border: 1px solid var(--seat-border);
		background: var(--seat-bg);
		color: var(--seat-text);
		font-weight: 600;
		font-size: 12px;
		cursor: pointer;
	}
	.preset:hover {
		border-color: var(--accent);
	}
	.slider-row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 8px;
		align-items: center;
	}
	.slider-row input[type='range'] {
		width: 100%;
		accent-color: var(--accent);
	}
	.amount {
		min-height: 36px;
		width: 96px;
		padding: 0 8px;
		border-radius: 8px;
		border: 1px solid var(--seat-border);
		background: var(--seat-bg);
		color: var(--seat-text);
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		text-align: right;
	}
</style>
