<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';
	import Spinner from './Spinner.svelte';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type Size = 'md' | 'lg';

	type Props = {
		variant?: Variant;
		size?: Size;
		loading?: boolean;
		href?: string;
		children: Snippet;
	} & Omit<HTMLButtonAttributes, 'children'> &
		Omit<HTMLAnchorAttributes, 'children'>;

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		href,
		disabled,
		class: klass = '',
		children,
		...rest
	}: Props = $props();

	const base =
		'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg';

	const variants: Record<Variant, string> = {
		primary: 'bg-accent text-black hover:bg-accent-hover active:scale-[0.98]',
		secondary: 'bg-surface-elev text-text hover:bg-[#272c27] border border-border',
		ghost: 'bg-transparent text-text hover:bg-surface',
		danger: 'bg-danger text-white hover:brightness-110'
	};

	const sizes: Record<Size, string> = {
		md: 'min-h-[44px] px-4 text-sm',
		lg: 'min-h-[52px] px-6 text-base'
	};

	const cls = $derived(`${base} ${variants[variant]} ${sizes[size]} ${klass}`);
</script>

{#if href}
	<a {href} class={cls} aria-disabled={disabled || loading} {...rest}>
		{#if loading}<Spinner size={16} />{/if}
		{@render children()}
	</a>
{:else}
	<button class={cls} disabled={disabled || loading} {...rest}>
		{#if loading}<Spinner size={16} />{/if}
		{@render children()}
	</button>
{/if}
