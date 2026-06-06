<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import MetricCard from '$lib/components/MetricCard.svelte';
  import TelemetryTrendPanel, { type TrendPoint, type TrendRange } from '$lib/components/TelemetryTrendPanel.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import GatewayOverviewPanel from '$lib/components/GatewayOverviewPanel.svelte';
  import { getGatewayHealth, listGateways } from '$lib/api/gateways';
  import { getCurrentTelemetry, getTelemetryHistory, getTelemetryPrediction, getTelemetryTrends, createTelemetryStream } from '$lib/api/telemetry';
  import { listNotifications } from '$lib/api/notifications';
  import type { Gateway, NotificationItem, Telemetry, TelemetryPrediction } from '$lib/types';

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
  let temperatureTrend = $state<TrendPoint[]>([]);
  let pressureTrend = $state<TrendPoint[]>([]);
  let humidityTrend = $state<TrendPoint[]>([]);
  let selectedTrendRange = $state<TrendRange>('today');
  let prediction = $state<TelemetryPrediction | null>(null);
  let loading = $state(true);
  let error = $state('');
  let stream: EventSource | null = null;
  let refreshInterval: ReturnType<typeof setInterval> | null = null;
  let sidebarCollapsed = $state(false);
  const SELECTED_GATEWAY_STORAGE_KEY = 'dashboardSelectedGatewayId';
  const CHART_TIME_ZONE = 'Europe/Prague';

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

  function getDatePartsInTimeZone(date: Date, timeZone: string): { year: number; month: number; day: number } {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date);

    return {
      year: Number(parts.find((part) => part.type === 'year')?.value),
      month: Number(parts.find((part) => part.type === 'month')?.value),
      day: Number(parts.find((part) => part.type === 'day')?.value)
    };
  }

  function shiftDateParts(
    parts: { year: number; month: number; day: number },
    days: number
  ): { year: number; month: number; day: number } {
    const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));

    return {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate()
    };
  }

  function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(date);

    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const hour = Number(values.hour === '24' ? '0' : values.hour);
    const asUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      hour,
      Number(values.minute),
      Number(values.second)
    );

    return asUtc - date.getTime();
  }

  function zonedDateTimeToUtc(
    parts: { year: number; month: number; day: number },
    hour: number,
    minute: number,
    second: number,
    millisecond: number,
    timeZone: string
  ): Date {
    const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, second, millisecond);
    const firstOffset = getTimeZoneOffsetMs(new Date(localAsUtc), timeZone);
    const firstResult = new Date(localAsUtc - firstOffset);
    const secondOffset = getTimeZoneOffsetMs(firstResult, timeZone);

    return new Date(localAsUtc - secondOffset);
  }

  function startOfPragueDayUtc(parts: { year: number; month: number; day: number }): Date {
    return zonedDateTimeToUtc(parts, 0, 0, 0, 0, CHART_TIME_ZONE);
  }

  function endOfPragueDayUtc(parts: { year: number; month: number; day: number }): Date {
    return zonedDateTimeToUtc(parts, 23, 59, 59, 999, CHART_TIME_ZONE);
  }

  function getTrendRangeDates(range: TrendRange): { from: string; to: string; label: string } {
    const now = new Date();
    const todayPrague = getDatePartsInTimeZone(now, CHART_TIME_ZONE);

    if (range === 'today') {
      return {
        from: startOfPragueDayUtc(todayPrague).toISOString(),
        to: now.toISOString(),
        label: 'dnešek'
      };
    }

    if (range === 'yesterday') {
      const yesterdayPrague = shiftDateParts(todayPrague, -1);

      return {
        from: startOfPragueDayUtc(yesterdayPrague).toISOString(),
        to: endOfPragueDayUtc(yesterdayPrague).toISOString(),
        label: 'včerejšek'
      };
    }

    if (range === 'week') {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { from: start.toISOString(), to: now.toISOString(), label: 'posledních 7 dní' };
    }

    const start = new Date(now);
    start.setMonth(start.getMonth() - 1);
    return { from: start.toISOString(), to: now.toISOString(), label: 'poslední měsíc' };
  }

  function getTrendHistoryLimit(range: TrendRange): number {
    if (range === 'today') return 288;
    if (range === 'yesterday') return 288;
    return 500;
  }

  function getTrendTargetPointCount(range: TrendRange): number {
    if (range === 'today') return 96;      // 15min buckets from 5min data
    if (range === 'yesterday') return 96;  // 15min buckets from 5min data
    if (range === 'week') return 28;       // 6h trend buckets
    return 30;                             // daily trend buckets
  }

  async function handleTrendRangeChange(range: TrendRange) {
    if (selectedTrendRange === range) return;
    selectedTrendRange = range;

    if (isValidGatewayId(selectedGatewayId)) {
      await loadTrendData(selectedGatewayId, range);
    }
  }
  function downsampleTrendPoints(values: TrendPoint[], targetCount: number): TrendPoint[] {
    if (values.length <= targetCount) return values;

    const result: TrendPoint[] = [];
    const bucketSize = values.length / targetCount;

    for (let bucketIndex = 0; bucketIndex < targetCount; bucketIndex += 1) {
      const start = Math.floor(bucketIndex * bucketSize);
      const end = Math.floor((bucketIndex + 1) * bucketSize);
      const bucket = values.slice(start, Math.max(end, start + 1));

      if (bucket.length === 0) continue;

      const avgValue = bucket.reduce((sum, point) => sum + point.value, 0) / bucket.length;

      const representativePoint =
              bucketIndex === 0
                      ? bucket[0]
                      : bucketIndex === targetCount - 1
                              ? bucket[bucket.length - 1]
                              : bucket[Math.floor(bucket.length / 2)];

      result.push({
        value: Number(avgValue.toFixed(2)),
        time: representativePoint.time,
        label: representativePoint.label
      });
    }

    return result;
  }

  async function loadTrendData(id: string, range: TrendRange = selectedTrendRange) {
    if (!isValidGatewayId(id)) return;

    const { from, to } = getTrendRangeDates(range);
    console.info('[dashboard] chart range', range, { from, to });
    const targetPointCount = getTrendTargetPointCount(range);

    const response =
      range === 'week'
        ? await getTelemetryTrends(id, from, to, '6h').catch(() => ({ items: [] }))
        : range === 'month'
          ? await getTelemetryTrends(id, from, to, '1d').catch(() => ({ items: [] }))
          : await getTelemetryHistory(id, from, to, getTrendHistoryLimit(range)).catch(() => ({ items: [] }));

    const historyItems = getHistoryItems(response);

    temperatureTrend = downsampleTrendPoints(
      trendValues(
        historyItems,
        ['temperature', 'telemetryTemperature', 'avgTemperature'],
        current?.temperature,
        current?.receivedAtUtc
      ),
      targetPointCount
    );

    pressureTrend = downsampleTrendPoints(
      trendValues(
        historyItems,
        ['pressure', 'telemetryPressure', 'avgPressure'],
        current?.pressure,
        current?.receivedAtUtc
      ),
      targetPointCount
    );

    humidityTrend = downsampleTrendPoints(
      trendValues(
        historyItems,
        ['humidity', 'telemetryHumidity', 'avgHumidity'],
        current?.humidity,
        current?.receivedAtUtc
      ),
      targetPointCount
    );
  }


  function statusDotClass(status: Gateway['status']): string {
    if (status === 'online') return 'bg-emerald-500';
    if (status === 'offline') return 'bg-red-500';
    return 'bg-slate-400';
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

  function getHistoryItems(response: unknown): unknown[] {
    if (Array.isArray(response)) return response;

    const record = response as Record<string, unknown>;

    if (Array.isArray(record.items)) return record.items;
    if (Array.isArray(record.telemetries)) return record.telemetries;
    if (Array.isArray(record.history)) return record.history;
    if (Array.isArray(record.data)) return record.data;

    return [];
  }

  function appendTrendValue(values: TrendPoint[], value: unknown, time?: string | null): TrendPoint[] {
    const nextValue = toNumber(value);
    if (nextValue === null) return values;
    return [...values, { value: nextValue, time: time ?? new Date().toISOString() }].slice(-500);
  }

  function normalizeTelemetryUpdate(input: unknown): Telemetry {
    const record = input as Record<string, unknown>;

    return {
      ...(record as Telemetry),
      temperature: toNumber(record.temperature ?? record.temp) ?? null,
      humidity: toNumber(record.humidity) ?? null,
      pressure: toNumber(record.pressure ?? record.pressure_hpa) ?? null,
      lighting: toNumber(record.lighting ?? record.light ?? record.lux) ?? null,
      raindropsAmount: toNumber(record.raindropsAmount ?? record.raindrops_amount) ?? null,
      batteryPercent: toNumber(record.batteryPercent ?? record.battery_percent) ?? null,
      batteryVoltage: toNumber(record.batteryVoltage ?? record.battery_voltage) ?? null,
      wifiRssi: toNumber(record.wifiRssi ?? record.wifi_rssi) ?? null,
      receivedAtUtc:
        typeof record.receivedAtUtc === 'string'
          ? record.receivedAtUtc
          : typeof record.created_at === 'string'
            ? record.created_at
            : typeof record.createdAt === 'string'
              ? record.createdAt
              : new Date().toISOString()
    } as Telemetry;
  }

  async function loadDashboard() {
    loading = true;
    error = '';

    try {
      console.info('[dashboard] loadDashboard started');
      const gatewayResult = await listGateways();
      console.info('[dashboard] gateways response', gatewayResult);

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
      const storedGatewayId = localStorage.getItem(SELECTED_GATEWAY_STORAGE_KEY);
      selectedGatewayId = isValidGatewayId(selectedGatewayId)
        ? selectedGatewayId
        : isValidGatewayId(storedGatewayId) && gateways.some((gateway) => gateway.id === storedGatewayId)
          ? storedGatewayId
          : gateways[0]?.id || '';
      console.info('[dashboard] selected gateway id', selectedGatewayId, 'is valid:', isValidGatewayId(selectedGatewayId));

      if (isValidGatewayId(selectedGatewayId)) {
        await loadGatewayData(selectedGatewayId);
      } else {
        console.warn('[dashboard] no valid gateway id, stream will not start');
      }

      notifications = await listNotifications(true)
        .then((result) => result.items)
        .catch(() => []);
    } catch (e) {
      console.error('[dashboard] loadDashboard failed', e);
      error = e instanceof Error ? e.message : 'Nepodařilo se načíst dashboard';
    } finally {
      loading = false;
    }
  }

  async function loadGatewayData(id: string) {
    console.info('[dashboard] loadGatewayData started', id);
    if (!isValidGatewayId(id)) {
      console.warn('[dashboard] loadGatewayData aborted because id is invalid', id);
      return;
    }
    stream?.close();
    stream = null;
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
    current = null;
    health = null;
    temperatureTrend = [];
    pressureTrend = [];
    humidityTrend = [];
    error = '';
    prediction = null;


    health = await getGatewayHealth(id).catch(() => null);

    if (health) {
      gateways = gateways.map((gateway) =>
        gateway.id === id
          ? {
              ...gateway,
              status: normalizeStatus(health?.status),
              lastTelemetryReceivedAt: health?.lastTelemetryAtUtc ?? gateway.lastTelemetryReceivedAt ?? null
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
    if (current) {
      current = normalizeTelemetryUpdate(current);
    }
    prediction = await getTelemetryPrediction(id).catch(() => null);

    await loadTrendData(id);

    console.info('[dashboard] calling setupStream', id);
    setupStream(id);
    refreshInterval = setInterval(() => {
      refreshCurrentTelemetry(id);
    }, 60000); // Time to wait before fetching telemetry again (in milliseconds).
  }

  async function refreshCurrentTelemetry(id: string) {
    if (!isValidGatewayId(id)) return;

    const nextCurrent = await getCurrentTelemetry(id)
      .then((result) => result.telemetry ?? (result as unknown as Telemetry))
      .catch(() => null);

    if (!nextCurrent) return;

    const normalizedTelemetry = normalizeTelemetryUpdate(nextCurrent);
    const previousTimestamp = current?.receivedAtUtc ?? null;
    const nextTimestamp = normalizedTelemetry.receivedAtUtc ?? null;

    if (nextTimestamp && nextTimestamp === previousTimestamp) return;

    console.info('[dashboard] polling telemetry update', normalizedTelemetry);
    applyTelemetryUpdate(normalizedTelemetry);
  }

  async function handleGatewayChange(event: Event) {
    const target = event.currentTarget as HTMLSelectElement;
    const nextId = target.value;

    selectedGatewayId = nextId;
    if (isValidGatewayId(nextId)) {
      localStorage.setItem(SELECTED_GATEWAY_STORAGE_KEY, nextId);
    }

    if (isValidGatewayId(nextId)) {
      await loadGatewayData(nextId);
    }
  }
  function applyTelemetryUpdate(telemetry: Telemetry) {
    const normalizedTelemetry = normalizeTelemetryUpdate(telemetry);
    current = normalizedTelemetry;

    if (selectedTrendRange !== 'yesterday') {
      temperatureTrend = appendTrendValue(temperatureTrend, normalizedTelemetry.temperature, normalizedTelemetry.receivedAtUtc);
      pressureTrend = appendTrendValue(pressureTrend, normalizedTelemetry.pressure, normalizedTelemetry.receivedAtUtc);
      humidityTrend = appendTrendValue(humidityTrend, normalizedTelemetry.humidity, normalizedTelemetry.receivedAtUtc);
    }

    const telemetryRecord = normalizedTelemetry as Telemetry & Record<string, unknown>;
    const latestTime = normalizedTelemetry.receivedAtUtc ?? new Date().toISOString();
    const batteryLevel = toNumber(telemetryRecord.batteryPercent ?? telemetryRecord.battery_percent);
    const wifiStrength = toNumber(telemetryRecord.wifiRssi ?? telemetryRecord.wifi_rssi);

    health = {
      gatewayId: Number(selectedGatewayId),
      status: 'online',
      lastTelemetryAtUtc: latestTime,
      nodeBatteryLevel: batteryLevel ?? health?.nodeBatteryLevel ?? null,
      nodeWifiStrength: wifiStrength ?? health?.nodeWifiStrength ?? null
    };

    gateways = gateways.map((gateway) =>
      gateway.id === selectedGatewayId
        ? {
            ...gateway,
            status: 'online',
            lastTelemetryReceivedAt: latestTime
          }
        : gateway
    );
  }

  function setupStream(id: string) {
    stream?.close();
    stream = createTelemetryStream(id);

    console.info('[dashboard] telemetry stream created for gateway', id, stream.url);

    stream.onopen = () => {
      console.info('[dashboard] telemetry stream opened for gateway', id);
    };

    stream.onerror = (event) => {
      console.warn('[dashboard] telemetry stream error for gateway', id, event);
    };

    function handleStreamEvent(event: MessageEvent, eventName: string) {
      try {
        console.info('[dashboard] SSE event received', eventName, event.data);

        const parsed = JSON.parse(event.data);
        const telemetry = parsed.data ?? parsed.telemetry ?? parsed.measurement ?? parsed;

        console.info('[dashboard] normalized telemetry update', normalizeTelemetryUpdate(telemetry));
        applyTelemetryUpdate(telemetry as Telemetry);
      } catch (error) {
        console.warn('[dashboard] malformed stream event ignored', eventName, error, event.data);
      }
    }

    stream.addEventListener('telemetry', (event) => {
      handleStreamEvent(event as MessageEvent, 'telemetry');
    });

    stream.addEventListener('measurement', (event) => {
      handleStreamEvent(event as MessageEvent, 'measurement');
    });

    stream.addEventListener('update', (event) => {
      handleStreamEvent(event as MessageEvent, 'update');
    });

    stream.onmessage = (event) => {
      handleStreamEvent(event, 'message');
    };
  }

  onMount(() => {
    console.info('[dashboard] component mounted');
    sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    const storedGatewayId = localStorage.getItem(SELECTED_GATEWAY_STORAGE_KEY);
    if (isValidGatewayId(storedGatewayId)) {
      selectedGatewayId = storedGatewayId;
    }

    const handleSidebarChange = (event: Event) => {
      sidebarCollapsed = (event as CustomEvent<boolean>).detail === true;
    };

    window.addEventListener('sidebar-collapsed-change', handleSidebarChange);
    loadDashboard();

    return () => {
      window.removeEventListener('sidebar-collapsed-change', handleSidebarChange);
    };
  });

  onDestroy(() => {
    stream?.close();
    if (refreshInterval) clearInterval(refreshInterval);
  });
</script>

<div class="min-h-screen bg-slate-100">
  <Sidebar />

  <main class={`transition-[padding] duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
    <div class="mx-auto max-w-400 px-4 pb-24 pt-6 sm:px-8 lg:px-10 lg:pb-6 xl:px-12">
      <header class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="mb-1 text-3xl font-medium text-blue-600">MeteoTrack</p>
          <h1 class="text-3xl font-bold tracking-tight">Přehled</h1>
          <p class="mt-1 text-sm text-slate-500">Aktuální hodnoty – {selectedGateway?.name ?? 'Meteostanice'}</p>
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
        <div class="grid min-h-105 place-items-center rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="text-center">
            <div class="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
            <p class="font-medium text-slate-700">Načítám dashboard…</p>
          </div>
        </div>
      {:else}
        <section class="rounded-4xl border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
          <div class="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0px,0px)_minmax(0,0.35fr)] xl:items-start">

            <div class="w-full rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
              <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <div class="flex items-center gap-3">
                  <h3 class="whitespace-nowrap text-sm font-semibold text-slate-900">Stav meteostanice</h3>
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
            <MetricCard label="Déšť" icon="🌧️" value={current?.raindropsAmount ?? '-'} unit="kapky" />
            <MetricCard label="Baterie" icon="🔋" value={health?.nodeBatteryLevel ?? '-'} unit="%" />
            <MetricCard label="Wi‑Fi" icon="📶" value={health?.nodeWifiStrength ?? '-'} unit="dBm" />
          </div>
        </section>

        {#if prediction}
          <section class="mt-8 rounded-4xl border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 class="text-base font-semibold">Predikce počasí</h2>
                <p class="mt-1 text-sm text-slate-500">
                  Vygenerováno: {formatTime(prediction.generatedAtUtc)}
                </p>
              </div>

              <div class="grid gap-3 sm:grid-cols-3 lg:min-w-130">
                <div class="rounded-2xl bg-slate-50 px-4 py-3">
                  <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Teplota</p>
                  <p class="mt-1 text-sm font-semibold text-slate-900">{prediction.temperatureTrend}</p>
                </div>
                <div class="rounded-2xl bg-slate-50 px-4 py-3">
                  <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Tlak</p>
                  <p class="mt-1 text-sm font-semibold text-slate-900">{prediction.pressureTrend}</p>
                </div>
                <div class="rounded-2xl bg-slate-50 px-4 py-3">
                  <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Vlhkost</p>
                  <p class="mt-1 text-sm font-semibold text-slate-900">{prediction.humidityTrend}</p>
                </div>
              </div>
            </div>

            <p class="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium leading-6 text-blue-900">
              {prediction.summary}
            </p>
          </section>
        {/if}

        <section class="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <TelemetryTrendPanel
            current={current}
            temperatureTrend={temperatureTrend}
            pressureTrend={pressureTrend}
            humidityTrend={humidityTrend}
            selectedRange={selectedTrendRange}
            rangeLabel={getTrendRangeDates(selectedTrendRange).label}
            onRangeChange={handleTrendRangeChange}
          />
          <aside class="rounded-4xl border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-base font-semibold">Poslední notifikace</h2>
              <a href="/notifications" class="primary-link">Zobrazit vše</a>
            </div>

            <div class="space-y-3">
              {#each visibleNotifications as item}
                <div class="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:border-blue-200 hover:bg-white hover:shadow-md">
                  <div class="flex items-start gap-3">
                    <div
                            class={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${
            item.type === 'danger'
              ? 'bg-red-500'
              : item.type === 'warning'
                ? 'bg-amber-500'
                : 'bg-blue-500'
          }`}
                    ></div>

                    <div class="min-w-0 flex-1">
                      <div class="mb-2 flex flex-wrap items-center gap-2">
            <span
                    class={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                item.type === 'danger'
                  ? 'bg-red-100 text-red-700'
                  : item.type === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
              }`}
            >
              {item.type}
            </span>

                        <span class="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700">
              meteostanice {item.gatewayId ?? 'systém'}
            </span>
                      </div>

                      <p class="text-sm font-semibold leading-5 text-slate-900">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </div>
              {:else}
                <div class="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                  Žádné aktivní notifikace.
                </div>
              {/each}
            </div>
          </aside>
        </section>

        <GatewayOverviewPanel
          {gateways}
          {onlineGatewaysCount}
          {offlineGatewaysCount}
          {formatTime}
        />
      {/if}
    </div>
  </main>
</div>
