<script lang="ts">
	import Avatar from '$lib/components/Avatar.svelte';
	import type { PublicPlayer, Card as CardT } from '$lib/realtime/protocol';
	import HoleCards from './HoleCards.svelte';

	interface Props {
		player: PublicPlayer | null;
		seatIndex: number;
		size: number;
		isDealer: boolean;
		isToAct: boolean;
		isMe: boolean;
		displayName: string;
		avatarUrl: string | null;
		myHoleCards: [CardT, CardT] | null;
		onClickEmpty?: () => void;
		emptyDisabled?: boolean;
		emptyDisabledReason?: string;
	}

	let {
		player,
		seatIndex,
		size,
		isDealer,
		isToAct,
		isMe,
		displayName,
		avatarUrl,
		myHoleCards,
		onClickEmpty,
		emptyDisabled = false,
		emptyDisabledReason
	}: Props = $props();

	const avatarSize = $derived(Math.round(size * 0.55));
	const statusBadge = $derived(
		!player
			? null
			: player.folded
				? 'Folded'
				: player.allIn
					? 'All-in'
					: player.status === 'sitout'
						? 'Sitting out'
						: player.status === 'away'
							? 'Away'
							: null
	);
</script>

{#if !player}
	<button
		class="seat empty"
		class:disabled={emptyDisabled}
		style:width="{size}px"
		style:min-height="{size}px"
		onclick={() => !emptyDisabled && onClickEmpty?.()}
		disabled={emptyDisabled}
		aria-label={emptyDisabled
			? `Seat ${seatIndex + 1} (unavailable${emptyDisabledReason ? `: ${emptyDisabledReason}` : ''})`
			: `Sit in seat ${seatIndex + 1}`}
	>
		<span class="empty-label">Sit here</span>
		<span class="seat-num">#{seatIndex + 1}</span>
	</button>
{:else}
	<div
		class="seat"
		class:active={isToAct}
		class:dimmed={player.folded || player.status === 'away'}
		class:me={isMe}
		style:width="{size}px"
	>
		<div class="avatar-wrap">
			<Avatar url={avatarUrl} name={displayName} size={avatarSize} />
			{#if isDealer}
				<span class="dealer" aria-label="Dealer button">D</span>
			{/if}
		</div>
		<div class="info">
			<div class="name" title={displayName}>{displayName}</div>
			<div class="stack">{player.stack.toLocaleString()}</div>
			{#if statusBadge}
				<div class="status">{statusBadge}</div>
			{/if}
		</div>
		{#if isMe && myHoleCards}
			<div class="my-cards">
				<HoleCards cards={myHoleCards} size="md" />
			</div>
		{:else if player.inHand && !player.folded}
			<div class="opp-cards">
				<HoleCards cards={null} faceDown size="sm" />
			</div>
		{/if}
	</div>
{/if}

<style>
	.seat {
		background: var(--seat-bg);
		border: 1px solid var(--seat-border);
		border-radius: var(--radius-md);
		color: var(--seat-text);
		box-shadow: var(--shadow-seat);
		padding: 8px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		text-align: center;
		font-family: ui-sans-serif, system-ui, sans-serif;
	}
	.seat.empty {
		background: transparent;
		border: 2px dashed var(--seat-border);
		color: var(--seat-text-dim);
		cursor: pointer;
		justify-content: center;
		transition: border-color 120ms ease;
	}
	.seat.empty:hover:not(.disabled) {
		border-color: var(--accent);
		color: var(--seat-text);
	}
	.seat.empty.disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}
	.seat.active {
		background: var(--seat-bg-active);
		border-color: var(--accent);
	}
	.seat.dimmed {
		opacity: 0.55;
	}
	.seat.me {
		border-color: var(--accent);
	}
	.avatar-wrap {
		position: relative;
	}
	.dealer {
		position: absolute;
		right: -6px;
		bottom: -6px;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--pot-text);
		color: var(--table-bg);
		font-size: 11px;
		font-weight: 800;
		display: grid;
		place-items: center;
	}
	.info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1px;
		line-height: 1.1;
		min-width: 0;
		width: 100%;
	}
	.name {
		font-size: 12px;
		font-weight: 600;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.stack {
		font-size: 13px;
		font-weight: 700;
		color: var(--pot-text);
		font-variant-numeric: tabular-nums;
	}
	.status {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--seat-text-dim);
	}
	.empty-label {
		font-size: 12px;
		font-weight: 600;
	}
	.seat-num {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
	.my-cards {
		margin-top: 4px;
	}
	.opp-cards {
		margin-top: 4px;
	}
</style>
