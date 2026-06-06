<script lang="ts">
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { authState } from '$lib/features/auth/auth-state.svelte';
	import CreateGatewayModal from '$lib/features/gateways/components/CreateGatewayModal.svelte';
	import GatewayGrid from '$lib/features/gateways/components/GatewayGrid.svelte';
	import { getGatewayHealth, listGateways } from '$lib/features/gateways/gateways-api';
	import type { Gateway, GatewayStatus } from '$lib/features/gateways/gateway-types';

	let gateways = $state<Gateway[]>([]);
	let statuses = $state<Record<number, GatewayStatus>>({});
	let loading = $state(true);
	let error = $state<string | null>(null);
	let search = $state('');
	let showCreate = $state(false);

	const canCreate = $derived(authState.can('operator'));

	const filtered = $derived.by(() => {
		const term = search.trim().toLowerCase();
		if (!term) return gateways;
		return gateways.filter((gateway) =>
			[gateway.name, gateway.location, gateway.description].join(' ').toLowerCase().includes(term)
		);
	});

	async function loadStatuses(items: Gateway[]) {
		const results = await Promise.allSettled(items.map((g) => getGatewayHealth(g.id)));
		const next: Record<number, GatewayStatus> = {};
		results.forEach((result, index) => {
			next[items[index].id] = result.status === 'fulfilled' ? result.value.status : 'unknown';
		});
		statuses = next;
	}

	async function load() {
		loading = true;
		error = null;
		try {
			const result = await listGateways({ pageSize: 100 });
			gateways = result.gateways;
			void loadStatuses(result.gateways);
		} catch {
			error = 'Seznam gatewayů se nepodařilo načíst.';
		} finally {
			loading = false;
		}
	}

	function handleCreated() {
		void load();
	}

	onMount(load);
</script>

<svelte:head>
	<title>Gatewaye · MeteoTrack</title>
</svelte:head>

<PageHeader title="Gatewaye" subtitle="Přehled všech měřicích stanic">
	{#snippet actions()}
		{#if canCreate}
			<Button onclick={() => (showCreate = true)}>
				{#snippet icon()}<Icon name="plus" size={16} />{/snippet}
				Přidat gateway
			</Button>
		{/if}
	{/snippet}
</PageHeader>

{#if !loading && gateways.length > 0}
	<div class="search">
		<span class="search-icon"><Icon name="search" size={16} /></span>
		<Input placeholder="Hledat podle názvu nebo umístění…" bind:value={search} />
	</div>
{/if}

{#if loading}
	<div class="state"><Spinner size="lg" /></div>
{:else if error}
	<EmptyState title="Chyba načítání" description={error}>
		{#snippet actions()}
			<Button variant="secondary" onclick={load}>Zkusit znovu</Button>
		{/snippet}
	</EmptyState>
{:else if gateways.length === 0}
	<EmptyState title="Žádné gatewaye" description="Zatím nebyl přidán žádný gateway.">
		{#snippet icon()}<Icon name="gateway" size={28} />{/snippet}
		{#snippet actions()}
			{#if canCreate}
				<Button onclick={() => (showCreate = true)}>Přidat gateway</Button>
			{/if}
		{/snippet}
	</EmptyState>
{:else if filtered.length === 0}
	<EmptyState title="Nic nenalezeno" description="Zkuste upravit vyhledávací dotaz." />
{:else}
	<GatewayGrid gateways={filtered} {statuses} />
{/if}

<CreateGatewayModal bind:open={showCreate} onCreated={handleCreated} />

<style>
	.search {
		position: relative;
		max-width: 28rem;
		margin-bottom: var(--space-6);
	}

	.search-icon {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color-text-subtle);
		pointer-events: none;
		z-index: 1;
	}

	.search :global(.input) {
		padding-left: 2.25rem;
	}

	.state {
		display: flex;
		justify-content: center;
		padding: var(--space-12);
	}
</style>
