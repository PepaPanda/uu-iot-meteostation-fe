<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import MetricCard from '$lib/components/MetricCard.svelte';
  import MiniLineChart from '$lib/components/MiniLineChart.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { getGatewayHealth, listGateways } from '$lib/api/gateways';
  import { getCurrentTelemetry, getTelemetryHistory, createTelemetryStream } from '$lib/api/telemetry';
  import { listNotifications } from '$lib/api/notifications';
  import type { Gateway, NotificationItem, Telemetry } from '$lib/types';

  let gateways = $state<Gateway[]>([]);
  let selectedGatewayId = $state('');
  let current = $state<Telemetry | null>(null);
  let health = $state<{
    gatewayId: number;
    status: string;
    lastTelemetryAtUtc: string | null;
    nodeBatteryLevel: number | null;
    nodeWifiStrength: number | null;
  } | null>(null);
  let notifications = $state<NotificationItem[]>([]);
  let temperatureTrend = $state<number[]>([]);
  let pressureTrend = $state<number[]>([]);
  let humidityTrend = $state<number[]>([]);
  let loading = $state(true);
  let error = $state('');
  let stream: EventSource | null = null;
  let sidebarCollapsed = $state(false);

  let selectedGateway = $derived(
    gateways.find((g) => g.id === selectedGatewayId)
  );

  const latestTelemetryTime = $derived(
    current?.receivedAtUtc ?? health?.lastTelemetryAtUtc ?? selectedGateway?.lastTelemetryReceivedAt ?? null
  );

  const formattedLatestTelemetryTime = $derived(
    latestTelemetryTime ? new Date(latestTelemetryTime).toLocaleString('cs-CZ') : '-'
  );

  const onlineGatewaysCount = $derived(
    gateways.filter((gateway) => gateway.status === 'online').length
  );

  const offlineGatewaysCount = $derived(
    gateways.filter((gateway) => gateway.status === 'offline').length
  );

  const visibleNotifications = $derived(notifications.slice(0, 4));

  function formatTime(value: string | null | undefined) {
    if (!value) return '-';
    return new Date(value).toLocaleString('cs-CZ');
  }

  function statusPillClass(status: Gateway['status']): string {
    if (status === 'online') return 'bg-emerald-50 text-emerald-700';
    if (status === 'offline') return 'bg-red-50 text-red-700';
    return 'bg-slate-100 text-slate-600';
  }

  function statusDotClass(status: Gateway['status']): string {
    if (status === 'online') return 'bg-emerald-500';
    if (status === 'offline') return 'bg-red-500';
    return 'bg-slate-400';
  }

  function notificationIcon(type: NotificationItem['type']) {
    if (type === 'danger') return '⛔';
    if (type === 'warning') return '⚠️';
    return 'ℹ️';
  }

  function normalizeStatus(status: string | undefined | null): Gateway['status'] {
    if (status === 'online' || status === 'offline' || status === 'unknown') return status;
    return 'unknown';
  }

  function isValidGatewayId(id: string | undefined | null): id is string {
    return typeof id === 'string' && /^\d+$/.test(id);
  }

  function toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  function trendValues(
    items: unknown[],
    keys: string[],
    fallback: number | null | undefined
  ): number[] {
    const values = items
      .map((item) => {
        const record = item as Record<string, unknown>;

        for (const key of keys) {
          const value = toNumber(record[key]);
          if (value !== null) return value;
        }

        return null;
      })
      .filter((value): value is number => value !== null);

    if (values.length > 0) return values;

    const fallbackValue = toNumber(fallback);
    return fallbackValue === null ? [] : [fallbackValue];
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

  function appendTrendValue(values: number[], value: unknown): number[] {
    const nextValue = toNumber(value);
    if (nextValue === null) return values;
    return [...values, nextValue].slice(-24);
  }

  async function loadDashboard() {
    loading = true;
    error = '';

    try {
      const gatewayResult = await listGateways();

      gateways = await Promise.all(
        gatewayResult.items.map(async (gateway) => {
          const gatewayHealth = await getGatewayHealth(gateway.id).catch(() => null);

          return {
            ...gateway,
            status: normalizeStatus(gatewayHealth?.status ?? gateway.status),
            lastTelemetryReceivedAt: gatewayHealth?.lastTelemetryAtUtc ?? gateway.lastTelemetryReceivedAt ?? null
          };
        })
      );
      selectedGatewayId = isValidGatewayId(selectedGatewayId) ? selectedGatewayId : gateways[0]?.id || '';

      if (isValidGatewayId(selectedGatewayId)) await loadGatewayData(selectedGatewayId);

      notifications = await listNotifications(true)
        .then((result) => result.items)
        .catch(() => []);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Nepodařilo se načíst dashboard';
    } finally {
      loading = false;
    }
  }

  async function loadGatewayData(id: string) {
    if (!isValidGatewayId(id)) return;
    stream?.close();
    stream = null;
    current = null;
    health = null;
    temperatureTrend = [];
    pressureTrend = [];
    humidityTrend = [];
    error = '';

    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const to = now.toISOString();

    health = await getGatewayHealth(id).catch(() => null);

    if (health) {
      gateways = gateways.map((gateway) =>
        gateway.id === id
          ? {
              ...gateway,
              status: normalizeStatus(health.status),
              lastTelemetryReceivedAt: health.lastTelemetryAtUtc ?? gateway.lastTelemetryReceivedAt ?? null
            }
          : gateway
      );
    }

    current = await getCurrentTelemetry(id)
      .then((result) => result.telemetry)
      .catch(() => null);

    if (!current) {
      current = await getCurrentTelemetry(id)
        .then((result) => result as unknown as Telemetry)
        .catch(() => null);
    }

    const historyResponse = await getTelemetryHistory(id, from, to, 500).catch(() => ({ items: [] }));
    const historyItems = getHistoryItems(historyResponse);

    temperatureTrend = trendValues(
      historyItems,
      ['temperature', 'telemetryTemperature', 'avgTemperature'],
      current?.temperature
    );
    pressureTrend = trendValues(
      historyItems,
      ['pressure', 'telemetryPressure', 'avgPressure'],
      current?.pressure
    );
    humidityTrend = trendValues(
      historyItems,
      ['humidity', 'telemetryHumidity', 'avgHumidity'],
      current?.humidity
    );

    setupStream(id);
  }

  async function handleGatewayChange(event: Event) {
    const target = event.currentTarget as HTMLSelectElement;
    const nextId = target.value;

    selectedGatewayId = nextId;

    if (isValidGatewayId(nextId)) {
      await loadGatewayData(nextId);
    }
  }

  function setupStream(id: string) {
    stream?.close();
    stream = createTelemetryStream(id);

    stream.addEventListener('telemetry', (event) => {
      try {
        const message = event as MessageEvent;
        const parsed = JSON.parse(message.data);
        const telemetry = parsed.data ?? parsed;
        current = telemetry;
        temperatureTrend = appendTrendValue(temperatureTrend, telemetry.temperature);
        pressureTrend = appendTrendValue(pressureTrend, telemetry.pressure);
        humidityTrend = appendTrendValue(humidityTrend, telemetry.humidity);
      } catch {
        // Ignore malformed stream event.
      }
    });

    stream.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const telemetry = parsed.data ?? parsed;
        current = telemetry;
        temperatureTrend = appendTrendValue(temperatureTrend, telemetry.temperature);
        pressureTrend = appendTrendValue(pressureTrend, telemetry.pressure);
        humidityTrend = appendTrendValue(humidityTrend, telemetry.humidity);
      } catch {
        // Ignore malformed stream event.
      }
    };
  }

  onMount(() => {
    sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

    const handleSidebarChange = (event: Event) => {
      sidebarCollapsed = (event as CustomEvent<boolean>).detail === true;
    };

    window.addEventListener('sidebar-collapsed-change', handleSidebarChange);
    loadDashboard();

    return () => {
      window.removeEventListener('sidebar-collapsed-change', handleSidebarChange);
    };
  });

  onDestroy(() => stream?.close());
</script>

<div class="app-shell">
  <Sidebar />

  <main class={`transition-[padding] duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
    <div class="mx-auto max-w-[1600px] px-4 pb-24 pt-6 sm:px-8 lg:px-10 lg:pb-6 xl:px-12">
      <header class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="mb-1 text-3xl font-medium text-blue-600">MeteoTrack</p>
          <h1 class="text-3xl font-bold tracking-tight">Přehled</h1>
          <p class="mt-1 text-sm text-slate-500">Aktuální přehled všech gatewayí a dat ze zařízení</p>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <span class={`h-2.5 w-2.5 rounded-full ${statusDotClass(selectedGateway?.status)}`}></span>
            <select
              bind:value={selectedGatewayId}
              onchange={handleGatewayChange}
              class="bg-transparent text-sm font-medium outline-none"
            >
              {#each gateways as gateway}
                <option value={gateway.id}>{gateway.name}</option>
              {/each}
            </select>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
            Aktualizováno: <span class="font-medium text-slate-900">{formatTime(current?.receivedAtUtc)}</span>
          </div>
        </div>
      </header>

      {#if error}
        <div class="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      {/if}

      {#if loading}
        <div class="grid min-h-[420px] place-items-center rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="text-center">
            <div class="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
            <p class="font-medium text-slate-700">Načítám dashboard…</p>
          </div>
        </div>
      {:else}
        <section class="panel panel-inner">
          <div class="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(500px,1200px)_minmax(0,0.35fr)] xl:items-start">
            <div>
              <h2 class="text-base font-semibold">Aktuální hodnoty – {selectedGateway?.name ?? 'Gateway'}</h2>
              <p class="text-sm text-slate-500">Živá data z posledního přenosu zařízení</p>
            </div>

            <div class="w-full rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
              <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <div class="flex items-center gap-3">
                  <h3 class="whitespace-nowrap text-sm font-semibold text-slate-900">Stav gatewaye</h3>
                  <StatusBadge status={selectedGateway?.status} />
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-slate-500">Poslední přenos:</span>
                  <span class="font-semibold text-slate-900">{formattedLatestTelemetryTime}</span>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-slate-500">Umístění:</span>
                  <span class="font-semibold text-slate-900">{selectedGateway?.location ?? '-'}</span>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-slate-500">ID zařízení:</span>
                  <span class="font-semibold text-slate-900">{current?.remoteId ?? '-'}</span>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-slate-500">Souřadnice:</span>
                  <span class="font-semibold text-slate-900">
                    {selectedGateway ? `${selectedGateway.latitude}, ${selectedGateway.longitude}` : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
            <MetricCard label="Teplota" icon="🌡️" value={current?.temperature ?? '-'} unit="°C" />
            <MetricCard label="Tlak" icon="🧭" value={current?.pressure ?? '-'} unit="hPa" />
            <MetricCard label="Vlhkost" icon="💧" value={current?.humidity ?? '-'} unit="%" />
            <MetricCard label="Světlo" icon="☀️" value={current?.lighting ?? '-'} unit="lx" />
            <MetricCard label="Déšť" icon="🌧️" value={current?.raindropsAmount ?? '-'} unit="raindrops" />
            <MetricCard label="Baterie" icon="🔋" value={health?.nodeBatteryLevel ?? '-'} unit="%" />
            <MetricCard label="Wi‑Fi" icon="📶" value={health?.nodeWifiStrength ?? '-'} unit="dBm" />
          </div>
        </section>

        <section class="mt-8 grid gap-6">
          <div class="panel panel-inner">
            <div class="mb-5 flex items-center justify-between">
              <div>
                <h2 class="text-base font-semibold">Rychlý přehled posledních 24 h</h2>
                <p class="text-sm text-slate-500">Teplota, tlak a vlhkost</p>
              </div>
            </div>

            <div class="grid gap-6 lg:grid-cols-3">
              <div class="rounded-3xl border border-slate-100 bg-slate-50/70 p-5 shadow-sm">
                <div class="mb-2 flex items-center justify-between">
                  <p class="text-sm font-medium text-slate-700">Teplota (°C)</p>
                  <span class="text-sm font-semibold text-slate-900">{current?.temperature ?? '-'} °C</span>
                </div>
                {#if temperatureTrend.length > 0}
                  <MiniLineChart values={temperatureTrend} unit="°C" />
                {:else}
                  <div class="grid h-[240px] place-items-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
                    Bez dat za posledních 24 h
                  </div>
                {/if}
              </div>

              <div class="rounded-3xl border border-slate-100 bg-slate-50/70 p-5 shadow-sm">
                <div class="mb-2 flex items-center justify-between">
                  <p class="text-sm font-medium text-slate-700">Tlak (hPa)</p>
                  <span class="text-sm font-semibold text-slate-900">{current?.pressure ?? '-'} hPa</span>
                </div>
                {#if pressureTrend.length > 0}
                  <MiniLineChart values={pressureTrend} unit="hPa" />
                {:else}
                  <div class="grid h-[240px] place-items-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
                    Bez dat za posledních 24 h
                  </div>
                {/if}
              </div>

              <div class="rounded-3xl border border-slate-100 bg-slate-50/70 p-5 shadow-sm">
                <div class="mb-2 flex items-center justify-between">
                  <p class="text-sm font-medium text-slate-700">Vlhkost (%)</p>
                  <span class="text-sm font-semibold text-slate-900">{current?.humidity ?? '-'} %</span>
                </div>
                {#if humidityTrend.length > 0}
                  <MiniLineChart values={humidityTrend} unit="%" />
                {:else}
                  <div class="grid h-[240px] place-items-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
                    Bez dat za posledních 24 h
                  </div>
                {/if}
              </div>
            </div>
          </div>



          <aside class="panel">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-base font-semibold">Poslední notifikace</h2>
              <a href="/notifications" class="primary-link">Zobrazit vše</a>
            </div>

            <div class="space-y-3">
              {#each visibleNotifications as item}
                <div class="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-sm">
                  <span>{notificationIcon(item.type)}</span>
                  <div class="min-w-0 flex-1">
                    <p class="font-medium text-slate-900">{item.text}</p>
                    <p class="mt-1 text-xs text-slate-500">Gateway {item.gatewayId ?? 'Systém'}</p>
                  </div>
                </div>
              {:else}
                <p class="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Žádné aktivní notifikace.</p>
              {/each}
            </div>
          </aside>
        </section>

        <section class="mt-8 panel">
          <div class="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 class="text-base font-semibold">Všechny gatewaye</h2>
              <p class="text-sm text-slate-500">Online: {onlineGatewaysCount} · Offline: {offlineGatewaysCount}</p>
            </div>
            <a href="/gateways" class="primary-link">Zobrazit všechny gatewaye →</a>
          </div>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {#each gateways.slice(0, 6) as gateway}
              <article class="rounded-3xl border border-slate-100 bg-slate-50/70 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
                <div class="mb-4 flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-base font-semibold text-slate-950">{gateway.name}</p>
                    <p class="mt-1 truncate text-sm text-slate-500">{gateway.location || 'Neznámá lokace'}</p>
                  </div>

                  <StatusBadge status={gateway.status} />
                </div>

                <div class="mb-5 rounded-2xl border border-slate-100 bg-white p-4">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-slate-500">Poslední přenos</span>
                    <span class="font-semibold text-slate-900">{formatTime(gateway.lastTelemetryReceivedAt)}</span>
                  </div>
                </div>

                <div class="flex items-center justify-between gap-3">
                  <div class="text-xs text-slate-500">
                    ID: <span class="font-medium text-slate-700">{gateway.id}</span>
                  </div>

                  <a
                    class="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    href={`/gateways/${gateway.id}`}
                  >
                    Detail
                  </a>
                </div>
              </article>
            {:else}
              <div class="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                Zatím nejsou dostupné žádné gatewaye.
              </div>
            {/each}
          </div>
        </section>
      {/if}
    </div>
  </main>
</div>
