import { defineConfig } from 'vitest/config';

// Dedicated vitest config so the test runner does not load SvelteKit / Tailwind
// plugins. The current suite is pure TypeScript (seat geometry); add a separate
// component-test setup later if we start testing .svelte files.
export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts']
	}
});
