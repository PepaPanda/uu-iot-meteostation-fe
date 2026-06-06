<script lang="ts">
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import NotificationList from '$lib/features/notifications/components/NotificationList.svelte';
	import {
		acknowledgeNotification,
		listNotifications
	} from '$lib/features/notifications/notifications-api';
	import type { AppNotification } from '$lib/features/notifications/notification-types';

	let notifications = $state<AppNotification[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let onlyUnacknowledged = $state(false);
	let acknowledgingId = $state<number | null>(null);
	let requestId = 0;

	async function load(unreadOnly: boolean) {
		const current = ++requestId;
		loading = true;
		error = null;
		try {
			const result = await listNotifications(unreadOnly || undefined);
			if (current !== requestId) return;
			notifications = result.notifications.sort(
				(a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
			);
		} catch {
			if (current === requestId) error = 'Notifikace se nepodařilo načíst.';
		} finally {
			if (current === requestId) loading = false;
		}
	}

	async function handleAcknowledge(id: number) {
		acknowledgingId = id;
		try {
			await acknowledgeNotification(id);
			if (onlyUnacknowledged) {
				notifications = notifications.filter((n) => n.id !== id);
			} else {
				notifications = notifications.map((n) => (n.id === id ? { ...n, acknowledged: true } : n));
			}
		} catch {
			error = 'Akci se nepodařilo dokončit.';
		} finally {
			acknowledgingId = null;
		}
	}

	$effect(() => {
		void load(onlyUnacknowledged);
	});
</script>

<svelte:head>
	<title>Notifikace · MeteoTrack</title>
</svelte:head>

<PageHeader title="Notifikace" subtitle="Upozornění a systémové zprávy">
	{#snippet actions()}
		<div class="filter" role="tablist" aria-label="Filtr notifikací">
			<button
				class="filter-btn"
				class:active={!onlyUnacknowledged}
				role="tab"
				aria-selected={!onlyUnacknowledged}
				onclick={() => (onlyUnacknowledged = false)}
			>
				Vše
			</button>
			<button
				class="filter-btn"
				class:active={onlyUnacknowledged}
				role="tab"
				aria-selected={onlyUnacknowledged}
				onclick={() => (onlyUnacknowledged = true)}
			>
				Nepřečtené
			</button>
		</div>
	{/snippet}
</PageHeader>

{#if loading}
	<div class="state"><Spinner size="lg" /></div>
{:else if error}
	<EmptyState title="Chyba načítání" description={error}>
		{#snippet actions()}
			<Button variant="secondary" onclick={() => load(onlyUnacknowledged)}>Zkusit znovu</Button>
		{/snippet}
	</EmptyState>
{:else if notifications.length === 0}
	<EmptyState
		title={onlyUnacknowledged ? 'Žádné nepřečtené notifikace' : 'Žádné notifikace'}
		description="Jste v obraze. Nové zprávy se zobrazí zde."
	>
		{#snippet icon()}<Icon name="bell" size={28} />{/snippet}
	</EmptyState>
{:else}
	<NotificationList {notifications} {acknowledgingId} onAcknowledge={handleAcknowledge} />
{/if}

<style>
	.filter {
		display: inline-flex;
		gap: 0.25rem;
		padding: 0.25rem;
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.filter-btn {
		padding: 0.35rem 0.85rem;
		border: none;
		background: transparent;
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.filter-btn.active {
		background-color: var(--color-primary-soft);
		color: var(--color-primary-soft-text);
		font-weight: 600;
	}

	.state {
		display: flex;
		justify-content: center;
		padding: var(--space-12);
	}
</style>
