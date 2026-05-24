<script lang="ts">
	import { derived as gs } from '$lib/realtime/gameStore.svelte';
	import { computeSeatPositions, type SeatPosition } from './seatGeometry';
	import Seat from './Seat.svelte';
	import CommunityCards from './CommunityCards.svelte';
	import Pot from './Pot.svelte';
	import BetChips from './BetChips.svelte';
	import TurnTimer from './TurnTimer.svelte';

	interface MemberLite {
		id: string;
		displayName: string;
		avatarUrl: string | null;
	}

	interface Props {
		currentUserId: string;
		members: MemberLite[];
		onEmptySeatClick: (seat: number) => void;
	}

	let { currentUserId, members, onEmptySeatClick }: Props = $props();

	let width = $state(0);
	let height = $state(0);

	const memberById = $derived(new Map(members.map((m) => [m.id, m])));
	const table = $derived(gs.table);
	const seatPositions = $derived<SeatPosition[]>(
		table ? computeSeatPositions(table.config.maxPlayers, gs.mySeatIndex, width, height) : []
	);

	function playerAtSeat(seat: number) {
		return table?.players.find((p) => p.seat === seat) ?? null;
	}

	const sitDownAllowed = $derived(gs.canSitDown);

	function ovalCx(): number {
		return width / 2;
	}
	function ovalCy(): number {
		return height / 2;
	}
</script>

<div class="table-wrap" bind:clientWidth={width} bind:clientHeight={height}>
	{#if table && width > 0 && height > 0}
		<svg class="surface" viewBox="0 0 {width} {height}" aria-hidden="true">
			<ellipse
				cx={ovalCx()}
				cy={ovalCy()}
				rx={Math.max(1, width / 2 - 24)}
				ry={Math.max(1, height / 2 - 24)}
				fill="var(--table-rail)"
			/>
			<ellipse
				cx={ovalCx()}
				cy={ovalCy()}
				rx={Math.max(1, width / 2 - 40)}
				ry={Math.max(1, height / 2 - 40)}
				fill="var(--table-surface)"
			/>
		</svg>

		<div class="center" style:left="{ovalCx()}px" style:top="{ovalCy()}px">
			<CommunityCards board={gs.board} size="md" />
			<div class="pot-wrap">
				<Pot pots={gs.pots} total={gs.potTotal} />
			</div>
		</div>

		{#each seatPositions as pos (pos.seatIndex)}
			{@const player = playerAtSeat(pos.seatIndex)}
			{@const member = player ? memberById.get(player.id) : null}
			<div
				class="seat-slot"
				style:left="{pos.x}px"
				style:top="{pos.y}px"
				style:width="{pos.size}px"
			>
				<Seat
					{player}
					seatIndex={pos.seatIndex}
					size={pos.size}
					isDealer={table.buttonSeat === pos.seatIndex}
					isToAct={table.toActSeat === pos.seatIndex}
					isMe={!!player && player.id === currentUserId}
					displayName={member?.displayName ?? (player ? 'Player' : '')}
					avatarUrl={member?.avatarUrl ?? null}
					myHoleCards={player && player.id === currentUserId ? gs.yourHoleCards : null}
					onClickEmpty={() => onEmptySeatClick(pos.seatIndex)}
					emptyDisabled={!sitDownAllowed}
					emptyDisabledReason={!gs.canActOnSeats
						? 'Hand in progress'
						: !gs.isSpectator
							? 'You are already seated'
							: undefined}
				/>
				{#if player && player.currentBet > 0}
					<div class="bet-chips">
						<BetChips amount={player.currentBet} />
					</div>
				{/if}
				{#if gs.isMyTurn && table.toActSeat === pos.seatIndex}
					<div class="ring">
						<TurnTimer
							progress={gs.turnProgress}
							secondsRemaining={gs.secondsRemaining}
							size={Math.round(pos.size * 1.4)}
						/>
					</div>
				{/if}
			</div>
		{/each}
	{/if}
</div>

<style>
	.table-wrap {
		position: relative;
		width: 100%;
		height: 100%;
		background: var(--table-bg);
		overflow: hidden;
	}
	.surface {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.center {
		position: absolute;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		pointer-events: none;
	}
	.pot-wrap {
		pointer-events: auto;
	}
	.seat-slot {
		position: absolute;
		transform: translate(-50%, -50%);
	}
	.bet-chips {
		position: absolute;
		left: 50%;
		bottom: -22px;
		transform: translateX(-50%);
		white-space: nowrap;
	}
	.ring {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}
</style>
