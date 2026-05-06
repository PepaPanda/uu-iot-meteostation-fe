<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { getGatewayHealth, listGateways } from '$lib/api/gateways';
  import type { Gateway } from '$lib/types';

  let gateways = $state<Gateway[]>([]);
  let search = $state('');
  let loading = $state(true);

  let filtered = $derived(
    gateways.filter((g) =>
      `${g.name} ${g.location}`.toLowerCase().includes(search.toLowerCase())
    )
  );

  function normalizeStatus(status: string | undefined | null): Gateway['status'] {
    if (status === 'online' || status === 'offline' || status === 'unknown') return status;
    return 'unknown';
  }

  function formatDateTime(value: string | null | undefined): string {
    if (!value) return '-';

    return new Date(value).toLocaleString('cs-CZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  async function loadGateways() {
    loading = true;

    const result = await listGateways();

    gateways = await Promise.all(
      result.items.map(async (gateway) => {
        const health = await getGatewayHealth(gateway.id).catch(() => null);

        return {
          ...gateway,
          status: normalizeStatus(health?.status ?? gateway.status),
          lastTelemetryReceivedAt: health?.lastTelemetryAtUtc ?? gateway.lastTelemetryReceivedAt ?? null
        };
      })
    );

    loading = false;
  }

  onMount(() => {
    loadGateways();
  });
</script>

<div class="min-h-screen bg-slate-100">
  <Sidebar />
  <main class="lg:pl-64">
    <div class="mx-auto max-w-7xl px-4 py-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">Gatewaye</h1>
          <p class="text-slate-500">Seznam všech meteo stanic</p>
        </div>
      </div>

      <div class="rounded-2xl border bg-white p-5 shadow-sm">
        <input bind:value={search} placeholder="Hledat gateway…" class="mb-4 w-full max-w-sm rounded-xl border px-3 py-2" />

        {#if loading}
          <p>Načítám…</p>
        {:else}
          <table class="w-full text-left text-sm">
            <thead class="text-slate-500">
              <tr><th class="py-2">Název</th><th>Lokace</th><th>Status</th><th>Poslední přenos</th><th>Akce</th></tr>
            </thead>
            <tbody>
              {#each filtered as gateway}
                <tr class="border-t">
                  <td class="py-3 font-medium">{gateway.name}</td>
                  <td>{gateway.location}</td>
                  <td><StatusBadge status={gateway.status} /></td>
                  <td>{formatDateTime(gateway.lastTelemetryReceivedAt)}</td>
                  <td><a class="text-blue-600" href={`/gateways/${gateway.id}`}>Detail</a></td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
    </div>
  </main>
</div>
