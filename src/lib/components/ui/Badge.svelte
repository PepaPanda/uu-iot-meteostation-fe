<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

	interface Props {
		variant?: Variant;
		dot?: boolean;
		children: Snippet;
	}

	let { variant = 'neutral', dot = false, children }: Props = $props();
</script>

<span class="badge {variant}">
	{#if dot}<span class="dot" aria-hidden="true"></span>{/if}
	{@render children()}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.2rem 0.6rem;
		font-size: var(--text-xs);
		font-weight: 600;
		line-height: 1.4;
		border-radius: var(--radius-full);
		border: 1px solid transparent;
		white-space: nowrap;
	}

	.dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: var(--radius-full);
		background-color: currentColor;
	}

	.neutral {
		background-color: var(--color-surface-muted);
		border-color: var(--color-border);
		color: var(--color-text-muted);
	}
	.primary {
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
	.info {
		background-color: var(--color-primary-soft);
		border-color: var(--color-primary-soft-border);
		color: var(--color-primary-soft-text);
	}
</style>
