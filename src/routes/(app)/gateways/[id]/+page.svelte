<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ApiError } from '$lib/api/errors';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { authState } from '$lib/features/auth/auth-state.svelte';
	import EditGatewayModal from '$lib/features/gateways/components/EditGatewayModal.svelte';
	import GatewayInfoPanel from '$lib/features/gateways/components/GatewayInfoPanel.svelte';
	import GatewayMapPanel from '$lib/features/gateways/components/GatewayMapPanel.svelte';
	import {
		deleteGateway,
		getGateway,
		getGatewayHealth,
		rotateGatewaySecret
	} from '$lib/features/gateways/gateways-api';
	import type { Gateway, GatewayHealth } from '$lib/features/gateways/gateway-types';
	import MetricGrid from '$lib/features/telemetry/components/MetricGrid.svelte';
	import PredictionPanel from '$lib/features/telemetry/components/PredictionPanel.svelte';
	import TelemetryTrendPanel from '$lib/features/telemetry/components/TelemetryTrendPanel.svelte';
	import { getCurrentTelemetry } from '$lib/features/telemetry/telemetry-api';
	import { subscribeTelemetry } from '$lib/features/telemetry/telemetry-stream';
	import type { Telemetry } from '$lib/features/telemetry/telemetry-types';

	const gatewayId = $derived(Number(page.params.id));

	let gateway = $state<Gateway | null>(null);
	let health = $state<GatewayHealth | null>(null);
	let current = $state<Telemetry | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let showEdit = $state(false);
	let showRotate = $state(false);
	let showDelete = $state(false);
	let rotatedSecret = $state<string | null>(null);
	let copied = $state(false);
	let actionLoading = $state(false);
	let actionError = $state<string | null>(null);

	const canEdit = $derived(authState.can('operator'));
	const canManage = $derived(authState.can('supervisor'));

	async function load(id: number) {
		loading = true;
		error = null;
		try {
			const [gatewayResult, healthResult] = await Promise.all([
				getGateway(id),
				getGatewayHealth(id).catch(() => null)
			]);
			gateway = gatewayResult;
			health = healthResult;
			current = await getCurrentTelemetry(id).catch(() => null);
		} catch (err) {
			error =
				err instanceof ApiError && err.status === 404
					? 'Gateway nebyl nalezen.'
					: 'Detail gatewaye se nepodařilo načíst.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (!Number.isNaN(gatewayId)) void load(gatewayId);
	});

	$effect(() => {
		if (Number.isNaN(gatewayId)) return;
		return subscribeTelemetry(gatewayId, (telemetry) => {
			current = telemetry;
		});
	});

	$effect(() => {
		if (Number.isNaN(gatewayId)) return;
		const interval = setInterval(() => {
			void getGatewayHealth(gatewayId)
				.then((result) => (health = result))
				.catch(() => undefined);
		}, 60_000);
		return () => clearInterval(interval);
	});

	function handleUpdated(updated: Gateway) {
		gateway = updated;
	}

	async function handleRotate() {
		actionLoading = true;
		actionError = null;
		try {
			const result = await rotateGatewaySecret(gatewayId);
			rotatedSecret = result.secret;
		} catch {
			actionError = 'Tajný klíč se nepodařilo otočit.';
		} finally {
			actionLoading = false;
		}
	}

	function closeRotate() {
		showRotate = false;
		rotatedSecret = null;
		copied = false;
		actionError = null;
	}

	async function copySecret() {
		if (!rotatedSecret) return;
		try {
			await navigator.clipboard.writeText(rotatedSecret);
			copied = true;
		} catch {
			copied = false;
		}
	}

	async function handleDelete() {
		actionLoading = true;
		actionError = null;
		try {
			await deleteGateway(gatewayId);
			await goto('/gateways');
		} catch {
			actionError = 'Gateway se nepodařilo smazat.';
			actionLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{gateway?.name ?? 'Gateway'} · MeteoTrack</title>
</svelte:head>

<a class="back" href="/gateways">
	<Icon name="arrow-left" size={16} /> Zpět na gatewaye
</a>

{#if loading}
	<div class="state"><Spinner size="lg" /></div>
{:else if error || !gateway}
	<EmptyState title="Chyba" description={error ?? 'Gateway nebyl nalezen.'}>
		{#snippet actions()}
			<Button variant="secondary" onclick={() => goto('/gateways')}>Zpět na gatewaye</Button>
		{/snippet}
	</EmptyState>
{:else}
	<PageHeader title={gateway.name} subtitle={gateway.location} />

	<div class="layout">
		<div class="col-main">
			<GatewayInfoPanel
				{gateway}
				{health}
				{canEdit}
				{canManage}
				onEdit={() => (showEdit = true)}
				onRotate={() => (showRotate = true)}
				onDelete={() => (showDelete = true)}
			/>

			<MetricGrid telemetry={current} />

			<TelemetryTrendPanel {gatewayId} />
		</div>

		<div class="col-side">
			<Card title="Poloha" padded={false}>
				<GatewayMapPanel
					gateways={[gateway]}
					statuses={{ [gateway.id]: health?.status ?? 'unknown' }}
					height="280px"
				/>
			</Card>

			<PredictionPanel {gatewayId} />
		</div>
	</div>
{/if}

<!-- Edit -->
{#if gateway}
	<EditGatewayModal bind:open={showEdit} {gateway} onUpdated={handleUpdated} />
{/if}

<!-- Rotate secret -->
<Modal open={showRotate} title="Otočit tajný klíč" onClose={closeRotate}>
	{#if rotatedSecret}
		<div class="secret-view">
			<Alert variant="warning" title="Nový klíč">
				Klíč se zobrazí pouze jednou. Aktualizujte konfiguraci zařízení.
			</Alert>
			<div class="secret-box">
				<code>{rotatedSecret}</code>
				<Button variant="secondary" size="sm" onclick={copySecret}>
					{copied ? 'Zkopírováno' : 'Kopírovat'}
				</Button>
			</div>
		</div>
	{:else}
		{#if actionError}<Alert variant="danger">{actionError}</Alert>{/if}
		<p class="confirm">
			Vygenerováním nového klíče přestane stávající klíč platit. Zařízení bude nutné znovu
			nakonfigurovat. Pokračovat?
		</p>
	{/if}

	{#snippet footer()}
		{#if rotatedSecret}
			<Button onclick={closeRotate}>Hotovo</Button>
		{:else}
			<Button variant="secondary" onclick={closeRotate}>Zrušit</Button>
			<Button variant="danger" loading={actionLoading} onclick={handleRotate}>Otočit klíč</Button>
		{/if}
	{/snippet}
</Modal>

<!-- Delete -->
<Modal open={showDelete} title="Smazat gateway" onClose={() => (showDelete = false)}>
	{#if actionError}<Alert variant="danger">{actionError}</Alert>{/if}
	<p class="confirm">
		Opravdu chcete smazat gateway <strong>{gateway?.name}</strong>? Veškerá související data budou
		odstraněna. Tuto akci nelze vrátit zpět.
	</p>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => (showDelete = false)}>Zrušit</Button>
		<Button variant="danger" loading={actionLoading} onclick={handleDelete}>Smazat</Button>
	{/snippet}
</Modal>

<style>
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: var(--space-4);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.back:hover {
		color: var(--color-text);
		text-decoration: none;
	}

	.layout {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
		gap: var(--space-6);
		align-items: start;
	}

	.col-main,
	.col-side {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		min-width: 0;
	}

	.secret-view {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.secret-box {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background-color: var(--color-surface-muted);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.secret-box code {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		word-break: break-all;
		color: var(--color-text);
	}

	.confirm {
		font-size: var(--text-sm);
		color: var(--color-text);
		line-height: 1.6;
	}

	.state {
		display: flex;
		justify-content: center;
		padding: var(--space-12);
	}

	@media (max-width: 1024px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
