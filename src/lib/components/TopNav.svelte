<script lang="ts">
	import { page } from '$app/state';

	const items = [
		{ href: '/home', label: 'Home' },
		{ href: '/profile', label: 'Profile' }
	];

	const path = $derived(page.url.pathname);
</script>

<nav class="sticky top-0 z-40 hidden border-b border-border bg-surface/90 backdrop-blur md:block">
	<div class="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
		<a href="/home" class="flex items-center gap-2 text-lg font-semibold text-accent">
			<span class="text-xl">♠</span> Poker Night
		</a>
		<ul class="flex items-center gap-1">
			{#each items as item (item.href)}
				{@const active = path === item.href || path.startsWith(item.href + '/')}
				<li>
					<a
						href={item.href}
						class="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
						class:text-accent={active}
						class:text-muted={!active}
						class:hover:text-text={!active}
					>
						{item.label}
					</a>
				</li>
			{/each}
			<li>
				<form action="/auth/signout" method="POST">
					<button
						class="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-text"
						type="submit"
					>
						Sign out
					</button>
				</form>
			</li>
		</ul>
	</div>
</nav>
