<script lang="ts">
	import type { Telemetry } from '../telemetry-types';
	import MetricCard from './MetricCard.svelte';

	interface Props {
		telemetry: Telemetry | null;
	}

	let { telemetry }: Props = $props();
</script>

<div class="grid">
	<MetricCard
		label="Teplota"
		icon="thermometer"
		accent="#ef4444"
		unit="°C"
		decimals={1}
		value={telemetry?.temperature}
	/>
	<MetricCard
		label="Vlhkost"
		icon="droplet"
		accent="#2563eb"
		unit="%"
		decimals={0}
		value={telemetry?.humidity}
	/>
	<MetricCard
		label="Tlak"
		icon="gauge"
		accent="#8b5cf6"
		unit="hPa"
		decimals={0}
		value={telemetry?.pressure}
	/>
	<MetricCard
		label="Osvětlení"
		icon="sun"
		accent="#f59e0b"
		unit="lx"
		decimals={0}
		value={telemetry?.lighting}
	/>
	<MetricCard
		label="Dešťové srážky"
		icon="droplet"
		accent="#06b6d4"
		unit=""
		decimals={0}
		value={telemetry?.raindropsAmount}
	/>
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
		gap: var(--space-4);
	}
</style>
