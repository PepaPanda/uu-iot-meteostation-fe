<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { page } from '$app/state';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import MetricCard from '$lib/components/MetricCard.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { getCurrentTelemetry, getTelemetryHistory, createTelemetryStream, getTelemetryPrediction } from '$lib/api/telemetry';
  import type { Gateway, Telemetry } from '$lib/types';
  import { getGateway, getGatewayHealth } from '$lib/api/gateways';
  import TelemetryTrendPanel, { type TrendPoint, type TrendRange } from '$lib/components/TelemetryTrendPanel.svelte';
  let gateway = $state<Gateway | null>(null);
  let current = $state<Telemetry | null>(null);
  let health = $state<{
    gatewayId: number;
    status: string;
    lastTelemetryAtUtc: string | null;
    nodeBatteryLevel: number | null;
    nodeWifiStrength: number | null;
  } | null>(null);
  let temperatureTrend = $state<TrendPoint[]>([]);
  let pressureTrend = $state<TrendPoint[]>([]);
  let humidityTrend = $state<TrendPoint[]>([]);
  let selectedTrendRange = $state<TrendRange>('today');
  let stream = $state<EventSource | null>(null);
  let loading = $state(true);
  let loadError = $state('');
  let rotateSecretLoading = $state(false);
  let rotatedGatewaySecret = $state('');
  let rotateSecretError = $state('');
  let sidebarCollapsed = $state(false);

  let prediction = $state<{
    generatedAtUtc?: string;
    temperatureTrend?: string;
    pressureTrend?: string;
    humidityTrend?: string;
    summary?: string;
  } | null>(null);

  let id = $derived(page.params.id ?? '');

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

  function trendValues(
    items: unknown[],
    keys: string[],
    fallback: number | null | undefined,
    fallbackTime?: string | null
  ): TrendPoint[] {
    const values: TrendPoint[] = items
      .map((item): TrendPoint | null => {
        const record = item as Record<string, unknown>;
        const time =
          typeof record.receivedAtUtc === 'string'
            ? record.receivedAtUtc
            : typeof record.received_at_utc === 'string'
              ? record.received_at_utc
              : typeof record.received_at === 'string'
                ? record.received_at
                : typeof record.measuredAtUtc === 'string'
                  ? record.measuredAtUtc
                  : typeof record.measured_at_utc === 'string'
                    ? record.measured_at_utc
                    : typeof record.measured_at === 'string'
                      ? record.measured_at
                      : typeof record.bucketStartUtc === 'string'
                        ? record.bucketStartUtc
                        : typeof record.bucket_start_utc === 'string'
                          ? record.bucket_start_utc
                          : typeof record.createdAt === 'string'
                            ? record.createdAt
                            : typeof record.created_at === 'string'
                              ? record.created_at
                              : undefined;

        for (const key of keys) {
          const value = toNumber(record[key]);
          if (value !== null) return { value, time };
        }

        return null;
      })
      .filter((value): value is TrendPoint => value !== null);

    if (values.length > 0) return values;

    const fallbackValue = toNumber(fallback);
    return fallbackValue === null ? [] : [{ value: fallbackValue, time: fallbackTime ?? undefined }];
  }

  function appendTrendValue(values: TrendPoint[], value: unknown, time?: string | null): TrendPoint[] {
    const nextValue = toNumber(value);
    if (nextValue === null) return values;
    return [...values, { value: nextValue, time: time ?? new Date().toISOString() }].slice(-500);
  }

  function getTrendRangeDates(range: TrendRange): { from: string; to: string; label: string } {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (range === 'today') {
      start.setHours(0, 0, 0, 0);
      return { from: start.toISOString(), to: now.toISOString(), label: 'dnešek' };
    }

    if (range === 'yesterday') {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return { from: start.toISOString(), to: end.toISOString(), label: 'včerejšek' };
    }

    if (range === 'week') {
      start.setDate(start.getDate() - 7);
      return { from: start.toISOString(), to: now.toISOString(), label: 'posledních 7 dní' };
    }

    start.setMonth(start.getMonth() - 1);
    return { from: start.toISOString(), to: now.toISOString(), label: 'poslední měsíc' };
  }

  function getTrendHistoryLimit(range: TrendRange): number {
    if (range === 'today') return 96;
    if (range === 'yesterday') return 96;
    if (range === 'week') return 56;
    return 60;
  }

  async function loadTrendData(range: TrendRange = selectedTrendRange) {
    if (!id) return;

    const { from, to } = getTrendRangeDates(range);
    const limit = getTrendHistoryLimit(range);
    const historyResponse = await getTelemetryHistory(id, from, to, limit).catch(() => ({ items: [] }));
    const historyItems = getHistoryItems(historyResponse);

    temperatureTrend = trendValues(
      historyItems,
      ['temperature', 'telemetryTemperature', 'avgTemperature'],
      current?.temperature,
      current?.receivedAtUtc
    );
    pressureTrend = trendValues(
      historyItems,
      ['pressure', 'telemetryPressure', 'avgPressure'],
      current?.pressure,
      current?.receivedAtUtc
    );
    humidityTrend = trendValues(
      historyItems,
      ['humidity', 'telemetryHumidity', 'avgHumidity'],
      current?.humidity,
      current?.receivedAtUtc
    );
  }

  async function handleTrendRangeChange(range: TrendRange) {
    if (selectedTrendRange === range) return;
    selectedTrendRange = range;
    await loadTrendData(range);
  }

  async function rotateGatewaySecret() {
    if (!id || rotateSecretLoading) return;

    const confirmed = window.confirm(
      'Opravdu chceš obnovit gateway token? Starý token přestane fungovat a nový se zobrazí pouze jednou.'
    );

    if (!confirmed) return;

    rotateSecretLoading = true;
    rotatedGatewaySecret = '';
    rotateSecretError = '';

    try {
      const response = await fetch(`/api/gateways/${id}/rotate-secret`, {
        method: 'POST',
        credentials: 'include'
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        rotateSecretError = body?.message ?? 'Token gatewaye se nepodařilo obnovit.';
        return;
      }

      rotatedGatewaySecret = body?.secret ?? '';
    } catch (error) {
      rotateSecretError = error instanceof Error ? error.message : 'Token gatewaye se nepodařilo obnovit.';
    } finally {
      rotateSecretLoading = false;
    }
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
      prediction = await getTelemetryPrediction(id).catch(() => null);

      if (gateway) {
        gateway = {
          ...gateway,
          status: normalizeStatus(health?.status ?? gateway.status),
          lastTelemetryReceivedAt:
            health?.lastTelemetryAtUtc ?? gateway.lastTelemetryReceivedAt ?? current?.receivedAtUtc ?? null
        };
      }

      await loadTrendData();

      stream = createTelemetryStream(id);
      stream.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          current = parsed.data ?? parsed;
          if (selectedTrendRange !== 'yesterday') {
            temperatureTrend = appendTrendValue(temperatureTrend, current?.temperature, current?.receivedAtUtc);
            pressureTrend = appendTrendValue(pressureTrend, current?.pressure, current?.receivedAtUtc);
            humidityTrend = appendTrendValue(humidityTrend, current?.humidity, current?.receivedAtUtc);
          }
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
    <div class="mx-auto max-w-400 px-4 pb-24 pt-6 sm:px-8 lg:px-10 lg:pb-6 xl:px-12">
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

        {#if prediction}
          <section class="mt-8 rounded-4xl border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
            <div class="flex flex-col gap-2">
              <h2 class="text-lg font-semibold text-slate-950">Predikce počasí</h2>
              <p class="text-sm text-slate-500">
                Vygenerováno: {formatDateTime(prediction.generatedAtUtc)}
              </p>
            </div>

            <div class="mt-6 grid gap-4 md:grid-cols-3">
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-sm text-slate-500">Teplota</p>
                <p class="mt-2 font-semibold text-slate-950">{prediction.temperatureTrend ?? '-'} </p>
              </div>

              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-sm text-slate-500">Tlak</p>
                <p class="mt-2 font-semibold text-slate-950">{prediction.pressureTrend ?? '-'}</p>
              </div>

              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-sm text-slate-500">Vlhkost</p>
                <p class="mt-2 font-semibold text-slate-950">{prediction.humidityTrend ?? '-'}</p>
              </div>
            </div>

            <div class="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
              {prediction.summary}
            </div>
          </section>
        {/if}
        <section class="mt-8 grid gap-6 lg:grid-cols-[22.5rem_minmax(0,1fr)]">
          <aside class="rounded-4xl border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
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

              <div class="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                <dt class="text-slate-500">Gateway token</dt>
                <dd class="mt-3 space-y-3">
                  <button
                          type="button"
                          class="inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={rotateSecretLoading}
                          onclick={rotateGatewaySecret}
                  >
                    {rotateSecretLoading ? 'Obnovuji token…' : 'Obnovit token gatewaye'}
                  </button>

                  <p class="text-xs leading-5 text-amber-800">
                    Nový token se zobrazí pouze jednou. Po obnovení ho zkopíruj do gateway konfigurace.
                  </p>

                  {#if rotatedGatewaySecret}
                    <div class="rounded-xl border border-amber-200 bg-white p-3">
                      <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Nový token</p>
                      <code class="block break-all rounded-lg bg-slate-white p-3 text-xs text-black">{rotatedGatewaySecret}</code>
                    </div>
                  {/if}

                  {#if rotateSecretError}
                    <p class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                      {rotateSecretError}
                    </p>
                  {/if}
                </dd>
              </div>
            </dl>
          </aside>

          <TelemetryTrendPanel
            current={current}
            temperatureTrend={temperatureTrend}
            pressureTrend={pressureTrend}
            humidityTrend={humidityTrend}
            selectedRange={selectedTrendRange}
            rangeLabel={getTrendRangeDates(selectedTrendRange).label}
            onRangeChange={handleTrendRangeChange}
          />
        </section>
      {/if}
    </div>
  </main>
</div>
