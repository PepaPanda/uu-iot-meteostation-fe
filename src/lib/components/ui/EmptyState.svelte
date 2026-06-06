<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		icon?: Snippet;
		actions?: Snippet;
	}

	let { title, description, icon, actions }: Props = $props();
</script>

<div class="empty">
	{#if icon}
		<div class="icon">{@render icon()}</div>
	{/if}
	<h3 class="title">{title}</h3>
	{#if description}
		<p class="description">{description}</p>
	{/if}
	{#if actions}
		<div class="actions">{@render actions()}</div>
	{/if}
</div>

<style>
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		padding: var(--space-12) var(--space-6);
		text-align: center;
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3.5rem;
		height: 3.5rem;
		border-radius: var(--radius-full);
		background-color: var(--color-surface-muted);
		color: var(--color-text-muted);
	}

	.title {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--color-text);
	}

	.description {
		max-width: 28rem;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.actions {
		margin-top: var(--space-2);
	}
</style>
