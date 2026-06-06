<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		subtitle?: string;
		padded?: boolean;
		class?: string;
		header?: Snippet;
		actions?: Snippet;
		footer?: Snippet;
		children: Snippet;
	}

	let {
		title,
		subtitle,
		padded = true,
		class: className = '',
		header,
		actions,
		footer,
		children
	}: Props = $props();

	const hasHeader = $derived(Boolean(title || subtitle || header || actions));
</script>

<section class="card {className}">
	{#if hasHeader}
		<header class="card-header">
			{#if header}
				{@render header()}
			{:else}
				<div class="titles">
					{#if title}<h2 class="title">{title}</h2>{/if}
					{#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
				</div>
			{/if}
			{#if actions}
				<div class="actions">{@render actions()}</div>
			{/if}
		</header>
	{/if}

	<div class="card-body" class:padded>
		{@render children()}
	</div>

	{#if footer}
		<footer class="card-footer">{@render footer()}</footer>
	{/if}
</section>

<style>
	.card {
		display: flex;
		flex-direction: column;
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-sm);
		overflow: hidden;
	}

	.card-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-5) var(--space-6);
		border-bottom: 1px solid var(--color-border);
	}

	.titles {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.title {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--color-text);
	}

	.subtitle {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.card-body.padded {
		padding: var(--space-6);
	}

	.card-footer {
		padding: var(--space-4) var(--space-6);
		border-top: 1px solid var(--color-border);
		background-color: var(--color-surface-muted);
	}
</style>
