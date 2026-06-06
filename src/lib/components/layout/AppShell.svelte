<script lang="ts">
	import type { Snippet } from 'svelte';
	import Sidebar from './Sidebar.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="shell">
	<Sidebar />
	<main class="main">
		<div class="content">
			{@render children()}
		</div>
	</main>
</div>

<style>
	.shell {
		display: flex;
		min-height: 100vh;
		background-color: var(--color-bg);
	}

	.main {
		flex: 1;
		min-width: 0;
	}

	.content {
		max-width: var(--content-max-width);
		margin: 0 auto;
		padding: var(--space-8);
	}

	@media (max-width: 768px) {
		.content {
			padding: var(--space-4) var(--space-4) calc(var(--space-12) + 3.5rem);
		}
	}
</style>
