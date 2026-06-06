<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon, { type IconName } from '$lib/components/ui/Icon.svelte';
	import { formatRelativeTime } from '$lib/utils/format';
	import type { AppNotification, NotificationType } from '../notification-types';

	interface Props {
		notification: AppNotification;
		acknowledging?: boolean;
		onAcknowledge?: (id: number) => void;
	}

	let { notification, acknowledging = false, onAcknowledge }: Props = $props();

	const ICON: Record<NotificationType, IconName> = {
		danger: 'warning',
		warning: 'warning',
		info: 'info'
	};
</script>

<article class="item" class:acknowledged={notification.acknowledged}>
	<span class="icon {notification.type}">
		<Icon name={ICON[notification.type]} size={18} />
	</span>

	<div class="content">
		<p class="text">{notification.text}</p>
		<span class="time">{formatRelativeTime(notification.createdAt)}</span>
	</div>

	{#if notification.acknowledged}
		<span class="done"><Icon name="check" size={16} /> Vyřízeno</span>
	{:else if onAcknowledge}
		<Button
			variant="secondary"
			size="sm"
			loading={acknowledging}
			onclick={() => onAcknowledge?.(notification.id)}
		>
			Označit jako přečtené
		</Button>
	{/if}
</article>

<style>
	.item {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-4);
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.item.acknowledged {
		background-color: var(--color-surface-muted);
		opacity: 0.75;
	}

	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--radius-md);
		flex-shrink: 0;
	}

	.icon.danger {
		background-color: var(--color-danger-soft);
		color: var(--color-danger-soft-text);
	}
	.icon.warning {
		background-color: var(--color-warning-soft);
		color: var(--color-warning-soft-text);
	}
	.icon.info {
		background-color: var(--color-primary-soft);
		color: var(--color-primary-soft-text);
	}

	.content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.text {
		font-size: var(--text-sm);
		color: var(--color-text);
		line-height: 1.5;
	}

	.time {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.done {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--color-success-soft-text);
		flex-shrink: 0;
	}
</style>
