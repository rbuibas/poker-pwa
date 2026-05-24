<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { PublicPlayer, TableConfig } from '$lib/realtime/protocol';
	import { prefs, type CardStyle, type ThemeName } from '$lib/prefs.svelte';
	import { flyOpts } from '$lib/motion.svelte';

	interface MemberLite {
		id: string;
		displayName: string;
	}

	interface Props {
		isOwner: boolean;
		canStandUp: boolean;
		canRebuy: boolean;
		canStartHand: boolean;
		canKick: boolean;
		gateReason: string | null;
		seatedPlayers: PublicPlayer[];
		members: MemberLite[];
		myStack: number;
		config: TableConfig;
		onClose: () => void;
		onStartHand: () => void;
		onStandUp: () => void;
		onSitOut: (next: boolean) => void;
		sitOutNext: boolean;
		onRebuy: (amount: number) => void;
		onKick: (userId: string) => void;
		onLeaveTable: () => void;
	}

	let {
		isOwner,
		canStandUp,
		canRebuy,
		canStartHand,
		canKick,
		gateReason,
		seatedPlayers,
		members,
		myStack,
		config,
		onClose,
		onStartHand,
		onStandUp,
		onSitOut,
		sitOutNext,
		onRebuy,
		onKick,
		onLeaveTable
	}: Props = $props();

	let rebuyAmount = $state(0);

	$effect(() => {
		if (rebuyAmount === 0) {
			rebuyAmount = Math.min(config.defaultBuyIn, Math.max(1, config.maxBuyIn - myStack));
		}
	});

	const memberById = $derived(new Map(members.map((m) => [m.id, m.displayName])));

	function setTheme(t: ThemeName): void {
		prefs.theme = t;
	}

	function setCardStyle(s: CardStyle): void {
		prefs.cardStyle = s;
	}
</script>

<div class="panel" in:fly={flyOpts(0, 200)} role="dialog" aria-label="Table settings">
	<header>
		<h2>Table</h2>
		<button class="x" onclick={onClose} aria-label="Close">×</button>
	</header>

	<section>
		<h3>Display</h3>
		<div class="row">
			<span class="lbl">Theme</span>
			<div class="seg">
				<button class:on={prefs.theme === 'flat'} onclick={() => setTheme('flat')}>Flat</button>
			</div>
		</div>
		<div class="row">
			<span class="lbl">Cards</span>
			<div class="seg">
				<button
					class:on={prefs.cardStyle === 'simplified'}
					onclick={() => setCardStyle('simplified')}>Simplified</button
				>
				<button
					class:on={prefs.cardStyle === 'traditional'}
					onclick={() => setCardStyle('traditional')}>Traditional</button
				>
			</div>
		</div>
		<div class="row">
			<span class="lbl">Sound</span>
			<label class="check">
				<input
					type="checkbox"
					checked={prefs.muted}
					onchange={(e) => (prefs.muted = (e.target as HTMLInputElement).checked)}
				/>
				Mute
			</label>
		</div>
	</section>

	<section>
		<h3>Hand</h3>
		<button
			class="btn primary"
			disabled={!canStartHand}
			title={canStartHand ? '' : (gateReason ?? 'Need at least 2 seated players')}
			onclick={onStartHand}>Start hand</button
		>
	</section>

	<section>
		<h3>My seat</h3>
		<label class="check">
			<input
				type="checkbox"
				checked={sitOutNext}
				onchange={(e) => onSitOut((e.target as HTMLInputElement).checked)}
			/>
			Sit out next hand
		</label>
		<button
			class="btn ghost"
			disabled={!canStandUp}
			title={canStandUp ? '' : (gateReason ?? 'Wait until the hand ends')}
			onclick={onStandUp}>Stand up</button
		>
		<div class="rebuy">
			<label>
				<span class="lbl">Rebuy</span>
				<input
					type="number"
					min={1}
					max={Math.max(1, config.maxBuyIn - myStack)}
					step={Math.max(1, config.bigBlind * 2)}
					value={rebuyAmount}
					oninput={(e) => (rebuyAmount = Number((e.target as HTMLInputElement).value))}
				/>
			</label>
			<button
				class="btn"
				disabled={!canRebuy || rebuyAmount <= 0}
				title={canRebuy ? '' : (gateReason ?? 'Wait until the hand ends')}
				onclick={() => onRebuy(rebuyAmount)}>Rebuy</button
			>
		</div>
	</section>

	{#if isOwner}
		<section>
			<h3>Owner: kick player</h3>
			{#if seatedPlayers.length === 0}
				<div class="empty">No seated players</div>
			{:else}
				<ul class="kicks">
					{#each seatedPlayers as p (p.id)}
						<li>
							<span>{memberById.get(p.id) ?? p.id}</span>
							<button
								class="btn danger"
								disabled={!canKick}
								title={canKick ? '' : (gateReason ?? 'Wait until the hand ends')}
								onclick={() => onKick(p.id)}>Kick</button
							>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}

	<section>
		<button class="btn ghost" onclick={onLeaveTable}>Leave table</button>
	</section>
</div>

<style>
	.panel {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: min(360px, 100vw);
		background: var(--seat-bg);
		color: var(--seat-text);
		border-left: 1px solid var(--seat-border);
		padding: 12px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 12px;
		z-index: 30;
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
	h3 {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--seat-text-dim);
		margin-bottom: 6px;
	}
	section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}
	.lbl {
		font-size: 13px;
		color: var(--seat-text-dim);
	}
	.seg {
		display: flex;
		gap: 4px;
	}
	.seg button {
		min-height: 36px;
		padding: 0 10px;
		border-radius: 8px;
		background: var(--table-bg);
		color: var(--seat-text);
		border: 1px solid var(--seat-border);
		font-weight: 600;
		font-size: 12px;
		cursor: pointer;
	}
	.seg button.on {
		background: var(--accent);
		color: var(--btn-text);
		border-color: var(--accent);
	}
	.check {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
	}
	.btn {
		min-height: 44px;
		padding: 0 14px;
		border-radius: var(--radius-md);
		font-weight: 700;
		font-size: 14px;
		color: var(--btn-text);
		border: none;
		cursor: pointer;
		background: var(--seat-bg-active);
	}
	.btn.primary {
		background: var(--accent);
	}
	.btn.ghost {
		background: transparent;
		color: var(--seat-text);
		border: 1px solid var(--seat-border);
	}
	.btn.danger {
		background: var(--danger);
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.x {
		background: transparent;
		color: var(--seat-text-dim);
		border: none;
		font-size: 22px;
		line-height: 1;
		cursor: pointer;
	}
	.rebuy {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 8px;
		align-items: end;
	}
	.rebuy input[type='number'] {
		min-height: 44px;
		padding: 0 8px;
		border-radius: 8px;
		background: var(--table-bg);
		color: var(--seat-text);
		border: 1px solid var(--seat-border);
		font-variant-numeric: tabular-nums;
		text-align: right;
		width: 100%;
	}
	.kicks {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.kicks li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}
	.empty {
		font-size: 12px;
		color: var(--seat-text-dim);
	}
</style>
