<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { Gateway, GatewayStatus } from '../gateway-types';
	import StatusBadge from './StatusBadge.svelte';

	interface Props {
		gateway: Gateway;
		status?: GatewayStatus;
	}

	let { gateway, status = 'unknown' }: Props = $props();
</script>

<a class="card" href={`/gateways/${gateway.id}`}>
	<div class="top">
		<h3 class="name">{gateway.name}</h3>
		<StatusBadge {status} />
	</div>

	<p class="location">
		<Icon name="map-pin" size={15} />
		<span>{gateway.location}</span>
	</p>

	{#if gateway.description}
		<p class="description">{gateway.description}</p>
	{/if}

	<span class="detail-link">
		Detail <Icon name="chevron-right" size={15} />
	</span>
</a>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-5);
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-sm);
		color: inherit;
		text-decoration: none;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease,
			transform 0.15s ease;
	}

	.card:hover {
		border-color: var(--color-border-strong);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
		text-decoration: none;
	}

	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.name {
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--color-text);
	}

	.location {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.description {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.detail-link {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		margin-top: auto;
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-primary);
	}
</style>
