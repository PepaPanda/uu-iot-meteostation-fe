<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { listGateways, getGatewayHealth } from '$lib/features/gateways/gateways-api';
	import type { Gateway, GatewayStatus } from '$lib/features/gateways/gateway-types';
	import GatewayMapPanel from '$lib/features/gateways/components/GatewayMapPanel.svelte';
	import GatewaySelector from '$lib/features/gateways/components/GatewaySelector.svelte';
	import NotificationList from '$lib/features/notifications/components/NotificationList.svelte';
	import { listNotifications } from '$lib/features/notifications/notifications-api';
	import type { AppNotification } from '$lib/features/notifications/notification-types';
	import MetricGrid from '$lib/features/telemetry/components/MetricGrid.svelte';
	import PredictionPanel from '$lib/features/telemetry/components/PredictionPanel.svelte';
	import TelemetryTrendPanel from '$lib/features/telemetry/components/TelemetryTrendPanel.svelte';
	import { getCurrentTelemetry } from '$lib/features/telemetry/telemetry-api';
	import { subscribeTelemetry } from '$lib/features/telemetry/telemetry-stream';
	import type { Telemetry } from '$lib/features/telemetry/telemetry-types';
	import { formatDateTime } from '$lib/utils/format';

	const STORAGE_KEY = 'meteotrack:dashboard-gateway';

	let gateways = $state<Gateway[]>([]);
	let statuses = $state<Record<number, GatewayStatus>>({});
	let selectedId = $state<number | null>(null);
	let current = $state<Telemetry | null>(null);
	let notifications = $state<AppNotification[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let currentRequest = 0;

	const recentNotifications = $derived(notifications.slice(0, 5));

	async function loadStatuses(items: Gateway[]) {
		const results = await Promise.allSettled(items.map((g) => getGatewayHealth(g.id)));
		const next: Record<number, GatewayStatus> = {};
		results.forEach((result, index) => {
			next[items[index].id] = result.status === 'fulfilled' ? result.value.status : 'unknown';
		});
		statuses = next;
	}

	async function loadCurrent(id: number) {
		const request = ++currentRequest;
		try {
			const telemetry = await getCurrentTelemetry(id);
			if (request === currentRequest) current = telemetry;
		} catch {
			if (request === currentRequest) current = null;
		}
	}

	async function loadInitial() {
		loading = true;
		error = null;
		try {
			const [gatewayResult, notificationResult] = await Promise.all([
				listGateways({ pageSize: 100 }),
				listNotifications().catch(() => ({ notifications: [] }))
			]);

			gateways = gatewayResult.gateways;
			notifications = notificationResult.notifications.sort(
				(a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
			);

			void loadStatuses(gatewayResult.gateways);

			const stored = browser ? localStorage.getItem(STORAGE_KEY) : null;
			const storedId = stored ? Number(stored) : null;
			const storedValid =
				storedId !== null && gatewayResult.gateways.some((g) => g.id === storedId);
			selectedId = storedValid ? storedId : (gatewayResult.gateways[0]?.id ?? null);
		} catch {
			error = 'Data se nepodařilo načíst.';
		} finally {
			loading = false;
		}
	}

	// Persist the selected gateway.
	$effect(() => {
		if (browser && selectedId !== null) localStorage.setItem(STORAGE_KEY, String(selectedId));
	});

	// Load current telemetry whenever the selected gateway changes.
	$effect(() => {
		const id = selectedId;
		if (id === null) {
			current = null;
			return;
		}
		void loadCurrent(id);
	});

	// Live updates via SSE.
	$effect(() => {
		const id = selectedId;
		if (id === null) return;
		return subscribeTelemetry(id, (telemetry) => {
			current = telemetry;
		});
	});

	// Fallback polling every 60s.
	$effect(() => {
		const id = selectedId;
		if (id === null) return;
		const interval = setInterval(() => void loadCurrent(id), 60_000);
		return () => clearInterval(interval);
	});

	onMount(loadInitial);
</script>

<svelte:head>
	<title>Přehled · MeteoTrack</title>
</svelte:head>

<PageHeader title="Přehled" subtitle="Aktuální stav měřicích stanic" />

{#if loading}
	<div class="state"><Spinner size="lg" /></div>
{:else if error}
	<EmptyState title="Chyba načítání" description={error}>
		{#snippet actions()}
			<Button variant="secondary" onclick={loadInitial}>Zkusit znovu</Button>
		{/snippet}
	</EmptyState>
{:else if gateways.length === 0}
	<EmptyState title="Žádné gatewaye" description="Pro zobrazení přehledu nejprve přidejte gateway.">
		{#snippet icon()}<Icon name="gateway" size={28} />{/snippet}
		{#snippet actions()}
			<Button onclick={() => (window.location.href = '/gateways')}>Přejít na gatewaye</Button>
		{/snippet}
	</EmptyState>
{:else}
	<div class="dashboard">
		<GatewaySelector bind:selectedId {gateways} {statuses} />

		{#if current}
			<p class="measured">
				<Icon name="clock" size={14} />
				Poslední měření: {formatDateTime(current.measuredAtUtc)}
			</p>
		{/if}

		<MetricGrid telemetry={current} />

		{#if selectedId !== null}
			<div class="row">
				<TelemetryTrendPanel gatewayId={selectedId} />
				<PredictionPanel gatewayId={selectedId} />
			</div>
		{/if}

		<div class="row">
			<Card title="Mapa stanic" padded={false}>
				<GatewayMapPanel {gateways} {statuses} height="360px" />
			</Card>

			<Card title="Nejnovější notifikace">
				{#snippet actions()}
					<a class="link" href="/notifications">Vše</a>
				{/snippet}
				{#if recentNotifications.length === 0}
					<p class="muted">Žádné notifikace.</p>
				{:else}
					<NotificationList notifications={recentNotifications} />
				{/if}
			</Card>
		</div>
	</div>
{/if}

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.measured {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		margin-top: calc(-1 * var(--space-2));
	}

	.row {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
		gap: var(--space-6);
		align-items: start;
	}

	.link {
		font-size: var(--text-sm);
		font-weight: 600;
	}

	.muted {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.state {
		display: flex;
		justify-content: center;
		padding: var(--space-12);
	}

	@media (max-width: 1024px) {
		.row {
			grid-template-columns: 1fr;
		}
	}
</style>
