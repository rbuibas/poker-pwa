<script lang="ts">
	import { page } from '$app/state';

	const items = [
		{ href: '/home', label: 'Home', icon: '♠' },
		{ href: '/profile', label: 'Profile', icon: '◯' }
	];

	const path = $derived(page.url.pathname);
</script>

<nav
	class="fixed right-0 bottom-0 left-0 z-40 border-t border-border bg-surface/95 backdrop-blur md:hidden"
	style="padding-bottom: env(safe-area-inset-bottom)"
>
	<ul class="flex">
		{#each items as item (item.href)}
			{@const active = path === item.href || path.startsWith(item.href + '/')}
			<li class="flex-1">
				<a
					href={item.href}
					class="flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors"
					class:text-accent={active}
					class:text-muted={!active}
				>
					<span class="text-xl leading-none">{item.icon}</span>
					<span>{item.label}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>
