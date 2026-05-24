<script lang="ts">
	// Pure presentational: the parent decides when to render this.
</script>

<div class="overlay" role="dialog" aria-modal="true">
	<div class="card">
		<div class="icon" aria-hidden="true">↻</div>
		<h2>Please rotate your device</h2>
		<p>The poker table is designed for landscape orientation.</p>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: var(--table-bg, #0d1117);
		display: grid;
		place-items: center;
		z-index: 70;
		padding: 24px;
		text-align: center;
		color: var(--seat-text, #e6edf3);
		font-family: ui-sans-serif, system-ui, sans-serif;
	}
	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}
	.icon {
		font-size: 64px;
		color: var(--accent, #4299e1);
		animation: spin 2s linear infinite;
	}
	@media (prefers-reduced-motion: reduce) {
		.icon {
			animation: none;
		}
	}
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	h2 {
		font-size: 18px;
		font-weight: 700;
	}
	p {
		font-size: 14px;
		color: var(--seat-text-dim, #8b98a5);
		max-width: 320px;
	}
</style>
