<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { Gateway, GatewayStatus } from '../gateway-types';
	import StatusBadge from './StatusBadge.svelte';

	interface Props {
		gateways: Gateway[];
		statuses?: Record<number, GatewayStatus>;
		selectedId: number | null;
	}

	let { gateways, statuses = {}, selectedId = $bindable(null) }: Props = $props();

	let open = $state(false);

	const selected = $derived(gateways.find((gateway) => gateway.id === selectedId) ?? null);

	function choose(id: number) {
		selectedId = id;
		open = false;
	}
</script>

<div class="selector" class:open>
	<button
		type="button"
		class="trigger"
		aria-expanded={open}
		aria-controls="gateway-selector-panel"
		onclick={() => (open = !open)}
	>
		<span class="trigger-main">
			<span class="trigger-icon"><Icon name="gateway" size={18} /></span>
			<span class="trigger-text">
				<span class="trigger-label">Vybraná stanice</span>
				<span class="trigger-name">{selected?.name ?? 'Vyberte stanici'}</span>
			</span>
		</span>
		<span class="trigger-side">
			{#if selected}
				<StatusBadge status={statuses[selected.id] ?? 'unknown'} />
			{/if}
			<span class="chevron"><Icon name="chevron-down" size={18} /></span>
		</span>
	</button>

	{#if open}
		<div id="gateway-selector-panel" class="panel">
			<ul class="grid" role="listbox" aria-label="Stanice">
				{#each gateways as gateway (gateway.id)}
					<li>
						<button
							type="button"
							class="gw-card"
							class:active={gateway.id === selectedId}
							role="option"
							aria-selected={gateway.id === selectedId}
							onclick={() => choose(gateway.id)}
						>
							<span class="gw-top">
								<span class="gw-name">{gateway.name}</span>
								<StatusBadge status={statuses[gateway.id] ?? 'unknown'} />
							</span>
							{#if gateway.location}
								<span class="gw-location">
									<Icon name="map-pin" size={14} />
									<span>{gateway.location}</span>
								</span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.selector {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-sm);
		overflow: hidden;
	}

	.trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-4) var(--space-5);
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		color: var(--color-text);
		transition: background-color 0.15s ease;
	}

	.trigger:hover {
		background-color: var(--color-surface-muted);
	}

	.trigger-main {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-width: 0;
	}

	.trigger-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--radius-md);
		background-color: var(--color-surface-muted);
		color: var(--color-primary);
		flex-shrink: 0;
	}

	.trigger-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.trigger-label {
		font-size: var(--text-xs);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.trigger-name {
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--color-text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.trigger-side {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-shrink: 0;
	}

	.chevron {
		display: inline-flex;
		color: var(--color-text-muted);
		transition: transform 0.2s ease;
	}

	.selector.open .chevron {
		transform: rotate(180deg);
	}

	.panel {
		border-top: 1px solid var(--color-border);
		padding: var(--space-4) var(--space-5) var(--space-5);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: var(--space-3);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.gw-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-4);
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		cursor: pointer;
		text-align: left;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease,
			transform 0.15s ease;
	}

	.gw-card:hover {
		border-color: var(--color-border-strong);
		box-shadow: var(--shadow-sm);
		transform: translateY(-1px);
	}

	.gw-card.active {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 1px var(--color-primary);
	}

	.gw-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-2);
	}

	.gw-name {
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--color-text);
	}

	.gw-location {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
</style>
