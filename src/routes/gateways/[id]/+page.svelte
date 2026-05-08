<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { page } from '$app/stores';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import MetricCard from '$lib/components/MetricCard.svelte';
  import MiniLineChart from '$lib/components/MiniLineChart.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { getCurrentTelemetry, getTelemetryHistory, createTelemetryStream } from '$lib/api/telemetry';
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
  let loadError = $state('');
  let sidebarCollapsed = $state(false);

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

  function normalizeStatus(status: string | undefined | null): Gateway['status'] {
    if (status === 'online' || status === 'offline' || status === 'unknown') return status;
    return 'unknown';
  }

  function toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  function getHistoryItems(response: unknown): unknown[] {
    if (Array.isArray(response)) return response;

    const record = response as Record<string, unknown>;

    if (Array.isArray(record.items)) return record.items;
    if (Array.isArray(record.telemetries)) return record.telemetries;
    if (Array.isArray(record.history)) return record.history;
    if (Array.isArray(record.data)) return record.data;

    return [];
  }

  function telemetryTemperatureValues(items: unknown[], fallback: number | null | undefined): number[] {
    const values = items
      .map((item) => {
        const record = item as Record<string, unknown>;
        return toNumber(record.temperature ?? record.telemetryTemperature ?? record.avgTemperature);
      })
      .filter((value): value is number => value !== null);

    if (values.length > 0) return values;

    const fallbackValue = toNumber(fallback);
    return fallbackValue === null ? [] : [fallbackValue];
  }

  function appendTrendValue(values: number[], value: unknown): number[] {
    const nextValue = toNumber(value);
    if (nextValue === null) return values;
    return [...values, nextValue].slice(-500);
  }

  async function load() {
    if (!id) {
      loading = false;
      loadError = 'Gateway nebyla nalezena.';
      return;
    }

    loading = true;
    loadError = '';

    try {
      gateway = (await getGateway(id)).gateway;
      current = await getCurrentTelemetry(id)
        .then((response) => response.telemetry)
        .catch(() => null);
      health = await getGatewayHealth(id).catch(() => null);

      if (gateway) {
        gateway = {
          ...gateway,
          status: normalizeStatus(health?.status ?? gateway.status),
          lastTelemetryReceivedAt:
            health?.lastTelemetryAtUtc ?? gateway.lastTelemetryReceivedAt ?? current?.receivedAtUtc ?? null
        };
      }

      const now = new Date();
      const from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const historyResponse = await getTelemetryHistory(id, from, now.toISOString(), 500).catch(() => ({ items: [] }));
      const historyItems = getHistoryItems(historyResponse);
      temperatureTrend = telemetryTemperatureValues(historyItems, current?.temperature);

      stream = createTelemetryStream(id);
      stream.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          current = parsed.data ?? parsed;
          temperatureTrend = appendTrendValue(temperatureTrend, current?.temperature);
        } catch {}
      };

      stream.onerror = () => {
        stream?.close();
        stream = null;
      };
    } catch (err) {
      loadError = err instanceof Error ? err.message : 'Data gatewaye nejsou k dispozici.';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

    const handleSidebarChange = (event: Event) => {
      sidebarCollapsed = (event as CustomEvent<boolean>).detail === true;
    };

    window.addEventListener('sidebar-collapsed-change', handleSidebarChange);
    load();

    return () => {
      window.removeEventListener('sidebar-collapsed-change', handleSidebarChange);
    };
  });

  onDestroy(() => stream?.close());
</script>

<div class="min-h-screen bg-slate-100">
  <Sidebar />

  <main class={`transition-[padding] duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
    <div class="mx-auto max-w-[1600px] px-4 pb-24 pt-6 sm:px-8 lg:px-10 lg:pb-6 xl:px-12">
      {#if loading}
        <div class="grid min-h-[50vh] place-items-center">
          <div class="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div class="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
            <p class="font-medium text-slate-700">Načítám detail gatewaye…</p>
          </div>
        </div>
      {:else if loadError && !gateway}
        <div class="grid min-h-[50vh] place-items-center">
          <div class="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 class="text-xl font-bold text-slate-950">Data nejsou k dispozici</h1>
            <p class="mt-2 text-sm text-slate-500">{loadError}</p>
            <a
              href="/gateways"
              class="mt-5 inline-flex rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Zpět na gatewaye
            </a>
          </div>
        </div>
      {:else}
        <header class="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <a href="/gateways" class="inline-flex items-center rounded-2xl bg-white px-3 py-2 text-sm font-medium text-blue-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-blue-50">
              ← Gatewaye
            </a>

            <p class="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              MeteoTrack Gateway
            </p>

            <div class="mt-2 flex flex-wrap items-center gap-3">
              <h1 class="text-3xl font-bold tracking-tight text-slate-950">{gateway?.name}</h1>
              <StatusBadge status={gateway?.status} />
            </div>

            <p class="mt-2 text-sm text-slate-500">{gateway?.location || 'Neznámá lokace'}</p>
          </div>
        </header>

        <section class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
          <MetricCard label="Teplota" icon="🌡️" value={current?.temperature ?? '-'} unit="°C" />
          <MetricCard label="Tlak" icon="⏱️" value={current?.pressure ?? '-'} unit="hPa" />
          <MetricCard label="Vlhkost" icon="💧" value={current?.humidity ?? '-'} unit="%" />
          <MetricCard label="Světlo" icon="☀️" value={current?.lighting ?? '-'} unit="lx" />
          <MetricCard label="Déšť" icon="🌧️" value={current?.raindropsAmount ?? '-'} unit="raindrops" />
          <MetricCard label="Baterie" icon="🔋" value={health?.nodeBatteryLevel ?? '-'} unit="%" />
          <MetricCard label="Wi‑Fi" icon="📶" value={health?.nodeWifiStrength ?? '-'} unit="dBm" />
        </section>

        <section class="mt-8 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside class="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
            <div class="mb-5 flex items-center justify-between gap-3">
              <h2 class="text-lg font-semibold text-slate-950">Informace</h2>
              <StatusBadge status={gateway?.status} />
            </div>

            <dl class="space-y-4 text-sm">
              <div class="rounded-2xl bg-slate-50 px-4 py-3">
                <dt class="text-slate-500">ID gatewaye</dt>
                <dd class="mt-1 font-semibold text-slate-900">{gateway?.id}</dd>
              </div>

              <div class="rounded-2xl bg-slate-50 px-4 py-3">
                <dt class="text-slate-500">Popis</dt>
                <dd class="mt-1 font-semibold text-slate-900">{gateway?.description || '-'}</dd>
              </div>

              <div class="rounded-2xl bg-slate-50 px-4 py-3">
                <dt class="text-slate-500">Lokace</dt>
                <dd class="mt-1 font-semibold text-slate-900">{gateway?.location || '-'}</dd>
              </div>

              <div class="rounded-2xl bg-slate-50 px-4 py-3">
                <dt class="text-slate-500">Souřadnice</dt>
                <dd class="mt-1 font-semibold text-slate-900">{gateway?.latitude}, {gateway?.longitude}</dd>
              </div>

              <div class="rounded-2xl bg-slate-50 px-4 py-3">
                <dt class="text-slate-500">Poslední přenos</dt>
                <dd class="mt-1 font-semibold text-slate-900">{formatDateTime(health?.lastTelemetryAtUtc ?? gateway?.lastTelemetryReceivedAt ?? current?.receivedAtUtc)}</dd>
              </div>
            </dl>
          </aside>

          <section class="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
            <div class="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 class="text-lg font-semibold text-slate-950">Graf teploty za 24 h</h2>
                <p class="mt-1 text-sm text-slate-500">Vývoj teploty podle telemetry historie</p>
              </div>
            </div>

            {#if temperatureTrend.length > 0}
              <div class="rounded-3xl border border-slate-100 bg-slate-50/70 p-5 shadow-sm">
                <MiniLineChart values={temperatureTrend} unit="°C" />
              </div>
            {:else}
              <div class="grid h-[260px] place-items-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                Bez dat za posledních 24 h
              </div>
            {/if}
          </section>
        </section>
      {/if}
    </div>
  </main>
</div>
