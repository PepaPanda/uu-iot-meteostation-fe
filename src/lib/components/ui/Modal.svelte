<script lang="ts">
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	interface Props {
		open?: boolean;
		title?: string;
		size?: 'sm' | 'md' | 'lg';
		onClose?: () => void;
		children: Snippet;
		footer?: Snippet;
	}

	let { open = $bindable(false), title, size = 'md', onClose, children, footer }: Props = $props();

	let dialog = $state<HTMLDivElement | null>(null);

	function close() {
		open = false;
		onClose?.();
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			close();
		}
	}

	$effect(() => {
		if (!browser) return;
		document.body.style.overflow = open ? 'hidden' : '';
		if (open) dialog?.focus();
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

{#if open}
	<div
		class="backdrop"
		transition:fade={{ duration: 150 }}
		onclick={close}
		onkeydown={onKeydown}
		role="presentation"
	>
		<div
			class="dialog {size}"
			bind:this={dialog}
			transition:scale={{ duration: 150, start: 0.97 }}
			onclick={(event) => event.stopPropagation()}
			onkeydown={(event) => event.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-label={title}
			tabindex="-1"
		>
			<header class="dialog-header">
				{#if title}<h2 class="dialog-title">{title}</h2>{/if}
				<button class="close" type="button" onclick={close} aria-label="Zavřít">×</button>
			</header>

			<div class="dialog-body">
				{@render children()}
			</div>

			{#if footer}
				<footer class="dialog-footer">{@render footer()}</footer>
			{/if}
		</div>
	</div>
{/if}

<svelte:window onkeydown={open ? onKeydown : undefined} />

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		background-color: rgb(15 23 42 / 0.45);
		backdrop-filter: blur(2px);
	}

	.dialog {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-height: calc(100vh - 2rem);
		background-color: var(--color-surface);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		overflow: hidden;
	}

	.sm {
		max-width: 24rem;
	}
	.md {
		max-width: 32rem;
	}
	.lg {
		max-width: 48rem;
	}

	.dialog-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-5) var(--space-6);
		border-bottom: 1px solid var(--color-border);
	}

	.dialog-title {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--color-text);
	}

	.close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		font-size: 1.5rem;
		line-height: 1;
		color: var(--color-text-muted);
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
	}

	.close:hover {
		background-color: var(--color-surface-hover);
		color: var(--color-text);
	}

	.dialog-body {
		padding: var(--space-6);
		overflow-y: auto;
	}

	.dialog-footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		padding: var(--space-4) var(--space-6);
		border-top: 1px solid var(--color-border);
		background-color: var(--color-surface-muted);
	}
</style>
