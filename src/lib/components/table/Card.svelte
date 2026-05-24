<script lang="ts">
	import type { Card } from '$lib/realtime/protocol';
	import { prefs } from '$lib/prefs.svelte';
	import { SUIT_GLYPH, SUIT_COLOR_VAR, cardLabel, isRed, pipLayout, rankLabel } from './cardArt';

	interface Props {
		card: Card | null;
		faceDown?: boolean;
		size?: 'sm' | 'md' | 'lg';
		highlight?: boolean;
	}

	let { card, faceDown = false, size = 'md', highlight = false }: Props = $props();

	const dims = $derived(
		size === 'sm'
			? { w: 36, h: 50, rankFs: 14, glyphFs: 12, bigGlyph: 22 }
			: size === 'lg'
				? { w: 72, h: 100, rankFs: 28, glyphFs: 24, bigGlyph: 44 }
				: { w: 52, h: 72, rankFs: 20, glyphFs: 16, bigGlyph: 32 }
	);

	const ariaLabel = $derived(
		!card ? 'Empty card slot' : faceDown ? 'Face-down card' : cardLabel(card.rank, card.suit)
	);
</script>

<div
	class="card-root"
	class:face-down={faceDown}
	class:highlight
	class:red={card && isRed(card.suit)}
	style:--card-w="{dims.w}px"
	style:--card-h="{dims.h}px"
	style:--rank-fs="{dims.rankFs}px"
	style:--glyph-fs="{dims.glyphFs}px"
	style:--big-glyph-fs="{dims.bigGlyph}px"
	style:--suit-color={card ? SUIT_COLOR_VAR[card.suit] : 'transparent'}
	role="img"
	aria-label={ariaLabel}
>
	{#if !card}
		<div class="empty"></div>
	{:else if faceDown}
		<div class="back">
			<div class="back-pattern"></div>
		</div>
	{:else if prefs.cardStyle === 'simplified'}
		<div class="simplified">
			<div class="rank">{rankLabel(card.rank)}</div>
			<div class="big-suit">{SUIT_GLYPH[card.suit]}</div>
		</div>
	{:else}
		<div class="traditional">
			<div class="corner top-left">
				<div class="t-rank">{rankLabel(card.rank)}</div>
				<div class="t-glyph">{SUIT_GLYPH[card.suit]}</div>
			</div>
			<div class="corner bottom-right">
				<div class="t-rank">{rankLabel(card.rank)}</div>
				<div class="t-glyph">{SUIT_GLYPH[card.suit]}</div>
			</div>
			<div class="pips">
				{#each pipLayout(card.rank) as [x, y], i (i)}
					<span class="pip" style:left="{x * 100}%" style:top="{y * 100}%">
						{SUIT_GLYPH[card.suit]}
					</span>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.card-root {
		width: var(--card-w);
		height: var(--card-h);
		border-radius: var(--card-radius, 8px);
		background: var(--card-bg);
		color: var(--card-text);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
		position: relative;
		overflow: hidden;
		display: block;
		flex-shrink: 0;
	}
	.card-root.red {
		color: var(--suit-color);
	}
	.card-root.highlight {
		box-shadow:
			0 0 0 2px var(--accent),
			0 1px 2px rgba(0, 0, 0, 0.45);
	}
	.card-root.face-down {
		background: var(--card-back);
	}
	.empty {
		width: 100%;
		height: 100%;
		border: 1px dashed var(--seat-border);
		border-radius: var(--card-radius, 8px);
		background: transparent;
	}
	.back {
		width: 100%;
		height: 100%;
		display: grid;
		place-items: center;
	}
	.back-pattern {
		width: 60%;
		height: 70%;
		border: 2px solid rgba(255, 255, 255, 0.35);
		border-radius: 4px;
		background-image: repeating-linear-gradient(
			45deg,
			rgba(255, 255, 255, 0.08) 0 4px,
			transparent 4px 8px
		);
	}
	.simplified {
		display: grid;
		grid-template-rows: 1fr 1fr;
		width: 100%;
		height: 100%;
		padding: 4px 6px;
		font-family: ui-sans-serif, system-ui, sans-serif;
		font-weight: 800;
	}
	.rank {
		font-size: var(--rank-fs);
		line-height: 1;
		text-align: left;
		color: var(--card-text);
	}
	.card-root.red .rank {
		color: var(--suit-color);
	}
	.big-suit {
		font-size: var(--big-glyph-fs);
		line-height: 1;
		text-align: right;
		align-self: end;
		color: var(--suit-color);
	}
	.traditional {
		position: relative;
		width: 100%;
		height: 100%;
		font-family: ui-sans-serif, system-ui, sans-serif;
		font-weight: 700;
	}
	.corner {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		line-height: 1;
	}
	.top-left {
		top: 4px;
		left: 4px;
	}
	.bottom-right {
		bottom: 4px;
		right: 4px;
		transform: rotate(180deg);
	}
	.t-rank {
		font-size: var(--rank-fs);
		color: var(--card-text);
	}
	.card-root.red .t-rank {
		color: var(--suit-color);
	}
	.t-glyph {
		font-size: var(--glyph-fs);
		color: var(--suit-color);
	}
	.pips {
		position: absolute;
		inset: 12% 18%;
		pointer-events: none;
	}
	.pip {
		position: absolute;
		transform: translate(-50%, -50%);
		font-size: var(--glyph-fs);
		color: var(--suit-color);
	}
</style>
