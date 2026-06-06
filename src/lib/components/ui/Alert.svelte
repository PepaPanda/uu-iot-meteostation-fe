<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'info' | 'success' | 'warning' | 'danger';

	interface Props {
		variant?: Variant;
		title?: string;
		children: Snippet;
	}

	let { variant = 'info', title, children }: Props = $props();
</script>

<div class="alert {variant}" role="alert">
	<div class="content">
		{#if title}<p class="title">{title}</p>{/if}
		<div class="body">{@render children()}</div>
	</div>
</div>

<style>
	.alert {
		padding: var(--space-3) var(--space-4);
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
	}

	.title {
		font-weight: 600;
		margin-bottom: 0.15rem;
	}

	.info {
		background-color: var(--color-primary-soft);
		border-color: var(--color-primary-soft-border);
		color: var(--color-primary-soft-text);
	}
	.success {
		background-color: var(--color-success-soft);
		border-color: var(--color-success-soft-border);
		color: var(--color-success-soft-text);
	}
	.warning {
		background-color: var(--color-warning-soft);
		border-color: var(--color-warning-soft-border);
		color: var(--color-warning-soft-text);
	}
	.danger {
		background-color: var(--color-danger-soft);
		border-color: var(--color-danger-soft-border);
		color: var(--color-danger-soft-text);
	}
</style>
