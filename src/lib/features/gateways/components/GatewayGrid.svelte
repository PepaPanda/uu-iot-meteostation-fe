<script lang="ts">
	import type { Gateway, GatewayStatus } from '../gateway-types';
	import GatewayCard from './GatewayCard.svelte';

	interface Props {
		gateways: Gateway[];
		statuses?: Record<number, GatewayStatus>;
	}

	let { gateways, statuses = {} }: Props = $props();
</script>

<div class="grid">
	{#each gateways as gateway (gateway.id)}
		<GatewayCard {gateway} status={statuses[gateway.id] ?? 'unknown'} />
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
		gap: var(--space-4);
	}
</style>
