<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg';

	interface Props extends HTMLButtonAttributes {
		variant?: Variant;
		size?: Size;
		loading?: boolean;
		block?: boolean;
		class?: string;
		children: Snippet;
		icon?: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		block = false,
		type = 'button',
		disabled = false,
		class: className = '',
		children,
		icon,
		...rest
	}: Props = $props();
</script>

<button
	{type}
	class="btn {variant} {size} {className}"
	class:block
	class:loading
	disabled={disabled || loading}
	{...rest}
>
	{#if loading}
		<span class="spinner" aria-hidden="true"></span>
	{:else if icon}
		<span class="icon">{@render icon()}</span>
	{/if}
	<span class="label">{@render children()}</span>
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		font-weight: 600;
		line-height: 1;
		white-space: nowrap;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease,
			color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.block {
		width: 100%;
	}

	/* Sizes */
	.sm {
		padding: 0.375rem 0.75rem;
		font-size: var(--text-sm);
	}
	.md {
		padding: 0.5rem 1rem;
		font-size: var(--text-sm);
	}
	.lg {
		padding: 0.7rem 1.25rem;
		font-size: var(--text-base);
	}

	/* Variants */
	.primary {
		background-color: var(--color-primary);
		color: var(--color-primary-contrast);
	}
	.primary:hover:not(:disabled) {
		background-color: var(--color-primary-hover);
	}

	.secondary {
		background-color: var(--color-surface);
		border-color: var(--color-border);
		color: var(--color-text);
	}
	.secondary:hover:not(:disabled) {
		background-color: var(--color-surface-hover);
		border-color: var(--color-border-strong);
	}

	.ghost {
		background-color: transparent;
		color: var(--color-text-muted);
	}
	.ghost:hover:not(:disabled) {
		background-color: var(--color-surface-hover);
		color: var(--color-text);
	}

	.danger {
		background-color: var(--color-danger);
		color: #fff;
	}
	.danger:hover:not(:disabled) {
		background-color: var(--color-danger-hover);
	}

	.icon {
		display: inline-flex;
		align-items: center;
	}

	.spinner {
		width: 1em;
		height: 1em;
		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: var(--radius-full);
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
