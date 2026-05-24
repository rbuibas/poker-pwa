<script lang="ts">
	interface Props {
		// Fraction of time remaining: 1 = just started, 0 = expired.
		progress: number;
		secondsRemaining: number;
		size?: number;
		stroke?: number;
	}

	let { progress, secondsRemaining, size = 88, stroke = 4 }: Props = $props();

	const radius = $derived((size - stroke) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const offset = $derived(circumference * (1 - Math.max(0, Math.min(1, progress))));
	const danger = $derived(secondsRemaining <= 5);
</script>

<svg
	class="ring"
	class:danger
	width={size}
	height={size}
	viewBox="0 0 {size} {size}"
	aria-hidden="true"
>
	<circle
		cx={size / 2}
		cy={size / 2}
		r={radius}
		stroke="var(--timer-track)"
		stroke-width={stroke}
		fill="none"
	/>
	<circle
		cx={size / 2}
		cy={size / 2}
		r={radius}
		stroke={danger ? 'var(--timer-fill-danger)' : 'var(--timer-fill)'}
		stroke-width={stroke}
		fill="none"
		stroke-linecap="round"
		stroke-dasharray={circumference}
		stroke-dashoffset={offset}
		transform="rotate(-90 {size / 2} {size / 2})"
	/>
	<text
		x="50%"
		y="50%"
		dominant-baseline="central"
		text-anchor="middle"
		font-size={Math.round(size * 0.22)}
		font-weight="700"
		fill={danger ? 'var(--timer-fill-danger)' : 'var(--timer-fill)'}
		font-family="ui-sans-serif, system-ui, sans-serif"
	>
		{Math.ceil(secondsRemaining)}
	</text>
</svg>

<style>
	.ring {
		display: block;
		pointer-events: none;
	}
</style>
