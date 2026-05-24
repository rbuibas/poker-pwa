<script lang="ts">
	import '$lib/theme/tokens.css';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onDestroy, onMount } from 'svelte';
	import { prefs } from '$lib/prefs.svelte';
	import {
		connection,
		disposeSocket,
		getSocket,
		refreshSocketAuth,
		type TypedSocket
	} from '$lib/realtime/socket.svelte';
	import { derived as gs, gameStore } from '$lib/realtime/gameStore.svelte';
	import type {
		GameEvent,
		PlayerAction,
		PlayerJoinedPayload,
		PlayerLeftPayload,
		PlayerStatusPayload,
		ServerErrorPayload,
		SessionStatePayload,
		YourTurnPayload
	} from '$lib/realtime/protocol';
	import { sound } from '$lib/sound/soundManager';
	import Table from '$lib/components/table/Table.svelte';
	import ActionBar from '$lib/components/table/ActionBar.svelte';
	import ConnectionBanner from '$lib/components/table/ConnectionBanner.svelte';
	import RotateDevicePrompt from '$lib/components/table/RotateDevicePrompt.svelte';
	import SitDownModal from '$lib/components/table/SitDownModal.svelte';
	import TableSettingsPanel from '$lib/components/table/TableSettingsPanel.svelte';

	let { data } = $props();

	const loungeId = $derived(data.lounge.id);
	const currentUserId = $derived(data.user!.id);

	const memberInfos = $derived(
		data.members.map((m) => ({
			id: m.user_id,
			displayName: m.profile.display_name,
			avatarUrl: m.profile.avatar_url
		}))
	);

	let socket: TypedSocket | null = $state(null);
	let triedRefresh = false;
	let wasDisconnected = false;
	let rafId: number | null = null;

	let portrait = $state(false);
	let sitDownSeat = $state<number | null>(null);
	let panelOpen = $state(false);
	let sitOutNext = $state(false);
	let toast = $state<string | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

	function showToast(msg: string): void {
		toast = msg;
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			toast = null;
		}, 3200);
	}

	function tick(): void {
		gameStore.tick(Date.now());
		rafId = requestAnimationFrame(tick);
	}

	function detachListeners(s: TypedSocket): void {
		s.off('session:state');
		s.off('session:player_joined');
		s.off('session:player_left');
		s.off('session:player_status');
		s.off('hand:event');
		s.off('hand:your_turn');
		s.off('hand:complete');
		s.off('error');
		s.off('connect');
		s.off('connect_error');
	}

	function attachListeners(s: TypedSocket): void {
		s.on('session:state', (payload: SessionStatePayload) => {
			gameStore.setSnapshot(payload);
		});

		s.on('session:player_joined', (payload: PlayerJoinedPayload) => {
			gameStore.applyPlayerJoined(payload);
		});

		s.on('session:player_left', (payload: PlayerLeftPayload) => {
			gameStore.applyPlayerLeft(payload);
		});

		s.on('session:player_status', (payload: PlayerStatusPayload) => {
			gameStore.applyPlayerStatus(payload);
		});

		s.on('hand:event', (evt: GameEvent) => {
			gameStore.applyEvent(evt);
			if (evt.type === 'hole_cards_dealt') sound.play('deal');
			else if (evt.type === 'action_taken') sound.play('chip');
		});

		s.on('hand:your_turn', (payload: YourTurnPayload) => {
			gameStore.setYourTurn(payload);
			sound.play('your_turn');
		});

		s.on('hand:complete', () => {
			gameStore.applyHandComplete();
			sound.play('win');
		});

		s.on('error', (payload: ServerErrorPayload) => {
			if (payload.code === 'rate_limited') return;
			if (payload.code === 'auth_failed') {
				void handleAuthFailed();
				return;
			}
			showToast(payload.message ?? payload.code);
		});

		s.on('connect', () => {
			triedRefresh = false;
			if (wasDisconnected) {
				gameStore.clearYourTurn();
				s.emit('session:join_room', { loungeId });
			}
			wasDisconnected = false;
		});

		s.io.on('reconnect_attempt', () => {
			wasDisconnected = true;
		});

		s.on('connect_error', (err) => {
			if (err.message === 'auth_failed') void handleAuthFailed();
		});
	}

	async function handleAuthFailed(): Promise<void> {
		if (triedRefresh) {
			showToast('Authentication failed. Please sign in again.');
			return;
		}
		triedRefresh = true;
		const { data: refreshed, error } = await data.supabase.auth.refreshSession();
		if (error || !refreshed.session) {
			showToast('Session expired. Please sign in again.');
			return;
		}
		const newSocket = refreshSocketAuth(refreshed.session.access_token);
		if (newSocket && newSocket !== socket) {
			if (socket) detachListeners(socket);
			attachListeners(newSocket);
			socket = newSocket;
		}
	}

	onMount(() => {
		const { session } = data;
		if (!session?.access_token) {
			void goto(resolve('/(app)/lounge/[id]', { id: loungeId }));
			return;
		}

		gameStore.setCurrentUserId(currentUserId);

		const s = getSocket(session.access_token);
		socket = s;
		attachListeners(s);
		s.emit('session:start', { loungeId });

		rafId = requestAnimationFrame(tick);

		const mq = window.matchMedia('(orientation: portrait)');
		portrait = mq.matches;
		const orientationListener = (e: MediaQueryListEvent) => {
			portrait = e.matches;
		};
		mq.addEventListener('change', orientationListener);

		try {
			// Best-effort landscape lock on supported platforms (mostly Android PWAs).
			const orientation = screen.orientation as ScreenOrientation & {
				lock?: (o: string) => Promise<void>;
			};
			void orientation.lock?.('landscape').catch(() => undefined);
		} catch {
			/* not supported */
		}

		return () => {
			mq.removeEventListener('change', orientationListener);
		};
	});

	onDestroy(() => {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		if (socket) {
			try {
				socket.emit('session:leave_room', { loungeId });
			} catch {
				/* socket already gone */
			}
			detachListeners(socket);
		}
		disposeSocket();
		gameStore.reset();
		try {
			(screen.orientation as { unlock?: () => void }).unlock?.();
		} catch {
			/* */
		}
	});

	// ── Actions emitted by child components ──────────────────────────────────

	function emitAction(action: PlayerAction): void {
		socket?.emit('hand:action', { loungeId, action });
		gameStore.clearYourTurn();
	}

	function onEmptySeatClick(seat: number): void {
		if (!gs.canSitDown) return;
		sitDownSeat = seat;
	}

	function onSitDownConfirm(buyIn: number): void {
		const seat = sitDownSeat;
		if (seat === null) return;
		socket?.emit('session:sit_down', { loungeId, seat, buyIn });
		sitDownSeat = null;
	}

	function onStartHand(): void {
		socket?.emit('hand:start', { loungeId });
	}

	function onStandUp(): void {
		socket?.emit('session:stand_up', { loungeId });
	}

	function onSitOutNext(next: boolean): void {
		sitOutNext = next;
		socket?.emit('session:sit_out', { loungeId, sitOut: next });
	}

	function onRebuy(amount: number): void {
		if (amount <= 0) return;
		socket?.emit('session:rebuy', { loungeId, amount });
	}

	function onKick(userId: string): void {
		socket?.emit('session:kick', { loungeId, targetUserId: userId });
	}

	function onLeaveTable(): void {
		void goto(resolve('/(app)/lounge/[id]', { id: loungeId }));
	}

	function onRetry(): void {
		socket?.connect();
	}

	const gateReason = $derived(
		gs.canActOnSeats ? null : 'Wait until the hand ends'
	);
</script>

<svelte:head>
	<title>{data.lounge.name} · Table</title>
</svelte:head>

<div
	data-theme={prefs.theme}
	class="poker-root"
	style:background="var(--table-bg)"
>
	<ConnectionBanner status={connection.status} {onRetry} />

	<div class="layout">
		<Table {currentUserId} members={memberInfos} {onEmptySeatClick} />
	</div>

	<button
		class="gear"
		onclick={() => (panelOpen = true)}
		aria-label="Table settings"
		title="Settings"
	>⚙</button>

	{#if panelOpen}
		<TableSettingsPanel
			isOwner={data.isOwner}
			canStandUp={gs.canStandUp}
			canRebuy={gs.canRebuy}
			canStartHand={gs.canStartHand}
			canKick={data.isOwner && gs.canActOnSeats}
			{gateReason}
			seatedPlayers={gs.table?.players ?? []}
			members={memberInfos.map((m) => ({ id: m.id, displayName: m.displayName }))}
			myStack={gs.myPlayer?.stack ?? 0}
			config={gs.table?.config ?? {
				smallBlind: data.lounge.settings.small_blind,
				bigBlind: data.lounge.settings.big_blind,
				ante: 0,
				maxPlayers: data.lounge.settings.max_players,
				defaultBuyIn: data.lounge.settings.default_buy_in,
				minBuyIn: data.lounge.settings.default_buy_in,
				maxBuyIn: data.lounge.settings.default_buy_in * 10
			}}
			onClose={() => (panelOpen = false)}
			onStartHand={() => {
				panelOpen = false;
				onStartHand();
			}}
			onStandUp={() => {
				panelOpen = false;
				onStandUp();
			}}
			onSitOut={onSitOutNext}
			{sitOutNext}
			onRebuy={(amt) => {
				panelOpen = false;
				onRebuy(amt);
			}}
			onKick={(uid) => {
				panelOpen = false;
				onKick(uid);
			}}
			onLeaveTable={() => {
				panelOpen = false;
				onLeaveTable();
			}}
		/>
	{/if}

	{#if gs.isMyTurn && gs.myLegalActions && gs.myPlayer && gs.table}
		<div class="action-dock">
			<ActionBar
				legalActions={gs.myLegalActions}
				pots={gs.pots}
				players={gs.table.players}
				myPlayer={gs.myPlayer}
				currentBet={gs.currentBet}
				bigBlind={gs.table.config.bigBlind}
				onAction={emitAction}
			/>
		</div>
	{/if}

	{#if sitDownSeat !== null && gs.table}
		<SitDownModal
			seat={sitDownSeat}
			config={gs.table.config}
			onConfirm={onSitDownConfirm}
			onCancel={() => (sitDownSeat = null)}
		/>
	{/if}

	{#if toast}
		<div class="toast" role="status">{toast}</div>
	{/if}

	{#if portrait}
		<RotateDevicePrompt />
	{/if}
</div>

<style>
	.poker-root {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		color: var(--seat-text);
	}
	.layout {
		flex: 1;
		min-height: 0;
		position: relative;
	}
	.gear {
		position: absolute;
		top: max(8px, env(safe-area-inset-top));
		right: max(8px, env(safe-area-inset-right));
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.55);
		color: var(--seat-text);
		border: 1px solid var(--seat-border);
		font-size: 20px;
		cursor: pointer;
		z-index: 35;
	}
	.action-dock {
		flex-shrink: 0;
	}
	.toast {
		position: fixed;
		bottom: 80px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--danger);
		color: #fff;
		padding: 8px 14px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 13px;
		z-index: 80;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
	}
</style>
