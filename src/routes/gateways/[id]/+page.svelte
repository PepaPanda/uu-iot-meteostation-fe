<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { page } from '$app/stores';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import MetricCard from '$lib/components/MetricCard.svelte';
  import MiniLineChart from '$lib/components/MiniLineChart.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { getCurrentTelemetry, getTelemetryTrends, createTelemetryStream } from '$lib/api/telemetry';
  import type { Gateway, Telemetry } from '$lib/types';
  import { getGateway, getGatewayHealth } from '$lib/api/gateways';
  let gateway = $state<Gateway | null>(null);
  let current = $state<Telemetry | null>(null);
  let health = $state<{
    gatewayId: number;
    status: string;
    lastTelemetryAtUtc: string | null;
    nodeBatteryLevel: number | null;
    nodeWifiStrength: number | null;
  } | null>(null);
  let temperatureTrend = $state<number[]>([]);
  let stream = $state<EventSource | null>(null);
  let loading = $state(true);

  let id = $derived($page.params.id ?? '');

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

  async function load() {
    if (!id) {
      loading = false;
      return;
    }

    gateway = (await getGateway(id)).gateway;
    current = (await getCurrentTelemetry(id)).telemetry;
    health = await getGatewayHealth(id).catch(() => null);

    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const trends = await getTelemetryTrends(id, from, now.toISOString(), '1h').catch(() => ({ items: [] }));
    temperatureTrend = trends.items.map((x) => x.avgTemperature).filter((x) => typeof x === 'number');

    stream = createTelemetryStream(id);
    stream.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        current = parsed.data ?? parsed;
      } catch {}
    };

    loading = false;
  }

  onMount(load);
  onDestroy(() => stream?.close());
</script>

<div class="min-h-screen bg-slate-100">
  <Sidebar />

  <main class="lg:pl-64">
    <div class="mx-auto max-w-7xl px-4 py-6">
      {#if loading}
        <p>Načítám…</p>
      {:else}
        <header class="mb-6 flex items-center justify-between">
          <div>
            <a href="/gateways" class="text-sm text-blue-600">← Gatewaye</a>
            <div class="mt-2 flex items-center gap-3">
              <h1 class="text-3xl font-bold">{gateway?.name}</h1>
              <StatusBadge status={gateway?.status} />
            </div>
            <p class="text-slate-500">{gateway?.location}</p>
          </div>
        </header>

        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Teplota" icon="🌡️" value={current?.temperature ?? '-'} unit="°C" />
          <MetricCard label="Tlak" icon="⏱️" value={current?.pressure ?? '-'} unit="hPa" />
          <MetricCard label="Vlhkost" icon="💧" value={current?.humidity ?? '-'} unit="%" />
          <MetricCard label="Světlo" icon="☀️" value={current?.lighting ?? '-'} unit="lx" />
          <MetricCard label="Déšť" icon="🌧️" value={current?.raindropsAmount ?? '-'} unit="raindrops" />
          <MetricCard label="Baterie" icon="🔋" value={health?.nodeBatteryLevel ?? '-'} unit="%" />
          <MetricCard label="Wi‑Fi" icon="📶" value={health?.nodeWifiStrength ?? '-'} unit="dBm" />
        </section>

        <section class="mt-6 grid gap-4 lg:grid-cols-3">
          <div class="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 class="mb-4 font-semibold">Informace</h2>
            <dl class="space-y-3 text-sm">
              <div><dt class="text-slate-500">ID</dt><dd>{gateway?.id}</dd></div>
              <div><dt class="text-slate-500">Popis</dt><dd>{gateway?.description}</dd></div>
              <div><dt class="text-slate-500">GPS</dt><dd>{gateway?.latitude}, {gateway?.longitude}</dd></div>
              <div><dt class="text-slate-500">Poslední přenos</dt><dd>{formatDateTime(gateway?.lastTelemetryReceivedAt ?? current?.receivedAtUtc)}</dd></div>
            </dl>
          </div>

          <div class="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2">
            <h2 class="mb-4 font-semibold">Graf teploty za 24 h</h2>
            <MiniLineChart values={temperatureTrend} />
          </div>
        </section>
      {/if}
    </div>
  </main>
</div>
