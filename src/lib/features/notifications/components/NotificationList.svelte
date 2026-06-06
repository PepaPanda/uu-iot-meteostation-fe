<script lang="ts">
	import type { AppNotification } from '../notification-types';
	import NotificationItem from './NotificationItem.svelte';

	interface Props {
		notifications: AppNotification[];
		acknowledgingId?: number | null;
		onAcknowledge?: (id: number) => void;
	}

	let { notifications, acknowledgingId = null, onAcknowledge }: Props = $props();
</script>

<div class="list">
	{#each notifications as notification (notification.id)}
		<NotificationItem
			{notification}
			acknowledging={acknowledgingId === notification.id}
			{onAcknowledge}
		/>
	{/each}
</div>

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
</style>
