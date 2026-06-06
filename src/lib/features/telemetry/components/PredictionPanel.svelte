<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { getPrediction } from '../telemetry-api';
	import type { Prediction } from '../telemetry-types';
	import { trendDirectionMeta } from '../telemetry-utils';

	interface Props {
		gatewayId: number;
	}

	let { gatewayId }: Props = $props();

	let prediction = $state<Prediction | null>(null);
	let loading = $state(true);
	let error = $state(false);
	let requestId = 0;

	async function load(id: number) {
		const current = ++requestId;
		loading = true;
		error = false;
		try {
			const result = await getPrediction(id);
			if (current === requestId) prediction = result;
		} catch {
			if (current === requestId) {
				prediction = null;
				error = true;
			}
		} finally {
			if (current === requestId) loading = false;
		}
	}

	$effect(() => {
		load(gatewayId);
	});

	const rows = $derived(
		prediction
			? [
					{ label: 'Teplota', trend: prediction.temperatureTrend },
					{ label: 'Tlak', trend: prediction.pressureTrend },
					{ label: 'Vlhkost', trend: prediction.humidityTrend }
				]
			: []
	);
</script>

<Card title="Předpověď trendu">
	{#if loading}
		<div class="state"><Spinner /></div>
	{:else if error || !prediction}
		<div class="state muted">Předpověď není k dispozici.</div>
	{:else}
		<div class="rows">
			{#each rows as row (row.label)}
				{@const meta = trendDirectionMeta(row.trend)}
				<div class="row">
					<span class="row-label">{row.label}</span>
					<span class="trend" style={`color: ${meta.color}`}>
						<span class="symbol">{meta.symbol}</span>
						{meta.label}
					</span>
				</div>
			{/each}
		</div>
		<p class="summary">{prediction.summary}</p>
	{/if}
</Card>

<style>
	.state {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 8rem;
	}

	.muted {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.rows {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-2) 0;
		border-bottom: 1px solid var(--color-border);
	}

	.row:last-child {
		border-bottom: none;
	}

	.row-label {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.trend {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-weight: 600;
		font-size: var(--text-sm);
	}

	.symbol {
		font-size: var(--text-lg);
		line-height: 1;
	}

	.summary {
		margin-top: var(--space-4);
		padding: var(--space-3) var(--space-4);
		background-color: var(--color-surface-muted);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		color: var(--color-text);
		line-height: 1.6;
	}
</style>
