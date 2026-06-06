<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { ApiError } from '$lib/api/errors';
	import { getTelemetryHistory, getTelemetryTrends } from '../telemetry-api';
	import type { MetricKey, TrendPoint, TrendRange } from '../telemetry-types';
	import {
		allMetrics,
		allRanges,
		bucketsToPoints,
		downsample,
		historyToPoints,
		metricMeta,
		resolveRange
	} from '../telemetry-utils';
	import TrendChart from './TrendChart.svelte';

	interface Props {
		gatewayId: number;
	}

	let { gatewayId }: Props = $props();

	let metric = $state<MetricKey>('temperature');
	let range = $state<TrendRange>('today');
	let points = $state<TrendPoint[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const meta = $derived(metricMeta(metric));
	let requestId = 0;

	async function load(
		currentGatewayId: number,
		currentMetric: MetricKey,
		currentRange: TrendRange
	) {
		const id = ++requestId;
		loading = true;
		error = null;

		try {
			const resolved = resolveRange(currentRange);
			let next: TrendPoint[];

			if (resolved.bucket === null) {
				const result = await getTelemetryHistory(currentGatewayId, {
					from: resolved.from,
					to: resolved.to,
					limit: 5000
				});
				next = downsample(historyToPoints(result.telemetries, currentMetric));
			} else {
				const result = await getTelemetryTrends(currentGatewayId, {
					from: resolved.from,
					to: resolved.to,
					bucket: resolved.bucket
				});
				next = bucketsToPoints(result.buckets, currentMetric);
			}

			if (id !== requestId) return;
			next.sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
			points = next;
		} catch (err) {
			if (id !== requestId) return;
			points = [];
			error =
				err instanceof ApiError && err.status === 404
					? 'Pro toto období nejsou k dispozici žádná data.'
					: 'Data se nepodařilo načíst.';
		} finally {
			if (id === requestId) loading = false;
		}
	}

	$effect(() => {
		load(gatewayId, metric, range);
	});
</script>

<Card title="Vývoj v čase">
	<div class="controls">
		<div class="tabs" role="tablist" aria-label="Veličina">
			{#each allMetrics() as item (item.key)}
				<button
					class="tab"
					class:active={metric === item.key}
					role="tab"
					aria-selected={metric === item.key}
					onclick={() => (metric = item.key)}
				>
					{item.label}
				</button>
			{/each}
		</div>

		<div class="ranges" role="tablist" aria-label="Období">
			{#each allRanges() as item (item.value)}
				<button
					class="range"
					class:active={range === item.value}
					role="tab"
					aria-selected={range === item.value}
					onclick={() => (range = item.value)}
				>
					{item.label}
				</button>
			{/each}
		</div>
	</div>

	<div class="chart-area">
		{#if loading}
			<div class="overlay"><Spinner /></div>
		{:else if error}
			<div class="overlay muted">{error}</div>
		{:else}
			<TrendChart
				{points}
				unit={meta.unit}
				decimals={meta.decimals}
				color={meta.color}
				areaColor={meta.areaColor}
			/>
		{/if}
	</div>
</Card>

<style>
	.controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
		margin-bottom: var(--space-5);
	}

	.tabs,
	.ranges {
		display: inline-flex;
		gap: 0.25rem;
		padding: 0.25rem;
		background-color: var(--color-surface-muted);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.tab,
	.range {
		padding: 0.35rem 0.75rem;
		border: none;
		background: transparent;
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--color-text-muted);
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
	}

	.tab.active,
	.range.active {
		background-color: var(--color-surface);
		color: var(--color-text);
		font-weight: 600;
		box-shadow: var(--shadow-sm);
	}

	.chart-area {
		position: relative;
		min-height: 260px;
	}

	.overlay {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 260px;
	}

	.muted {
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}
</style>
