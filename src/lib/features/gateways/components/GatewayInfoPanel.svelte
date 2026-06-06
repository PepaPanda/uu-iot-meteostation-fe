<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { formatCoordinates, formatDateTime, formatNumber } from '$lib/utils/format';
	import type { Gateway, GatewayHealth } from '../gateway-types';
	import StatusBadge from './StatusBadge.svelte';

	interface Props {
		gateway: Gateway;
		health: GatewayHealth | null;
		canEdit?: boolean;
		canManage?: boolean;
		onEdit?: () => void;
		onRotate?: () => void;
		onDelete?: () => void;
	}

	let {
		gateway,
		health,
		canEdit = false,
		canManage = false,
		onEdit,
		onRotate,
		onDelete
	}: Props = $props();
</script>

<Card title={gateway.name} subtitle={gateway.location}>
	{#snippet actions()}
		{#if canEdit}
			<Button variant="secondary" size="sm" onclick={onEdit}>
				{#snippet icon()}<Icon name="edit" size={15} />{/snippet}
				Upravit
			</Button>
		{/if}
		{#if canManage}
			<Button variant="secondary" size="sm" onclick={onRotate}>
				{#snippet icon()}<Icon name="rotate" size={15} />{/snippet}
				Otočit klíč
			</Button>
			<Button variant="danger" size="sm" onclick={onDelete}>
				{#snippet icon()}<Icon name="trash" size={15} />{/snippet}
				Smazat
			</Button>
		{/if}
	{/snippet}

	<div class="info">
		<div class="status-row">
			<StatusBadge status={health?.status ?? 'unknown'} />
			<span class="muted">
				Poslední data: {formatDateTime(health?.lastTelemetryAtUtc)}
			</span>
		</div>

		{#if gateway.description}
			<p class="description">{gateway.description}</p>
		{/if}

		<dl class="meta">
			<div class="meta-item">
				<dt><Icon name="map-pin" size={15} /> Souřadnice</dt>
				<dd>{formatCoordinates(gateway.latitude, gateway.longitude)}</dd>
			</div>
			<div class="meta-item">
				<dt><Icon name="battery" size={15} /> Baterie</dt>
				<dd>{formatNumber(health?.nodeBatteryLevel, { decimals: 0, unit: '%' })}</dd>
			</div>
			<div class="meta-item">
				<dt><Icon name="wifi" size={15} /> Signál</dt>
				<dd>{formatNumber(health?.nodeWifiStrength, { decimals: 0, unit: 'dBm' })}</dd>
			</div>
		</dl>
	</div>
</Card>

<style>
	.info {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.status-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.muted {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.description {
		font-size: var(--text-sm);
		color: var(--color-text);
		line-height: 1.6;
	}

	.meta {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: var(--space-4);
		margin: 0;
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.meta-item dt {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.meta-item dd {
		margin: 0;
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--color-text);
	}
</style>
