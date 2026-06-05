<script lang="ts">
  import Layerchart from '$lib/components/Layerchart.svelte';
  import type { Telemetry } from '$lib/types';

  export type TrendPoint = {
    value: number;
    time?: string;
    label?: string;
  };

  export type TrendRange = 'today' | 'yesterday' | 'week' | 'month';
  type TrendMetric = 'temperature' | 'pressure' | 'humidity';

  type Props = {
    current?: Telemetry | null;
    temperatureTrend?: TrendPoint[];
    pressureTrend?: TrendPoint[];
    humidityTrend?: TrendPoint[];
    selectedRange?: TrendRange;
    rangeLabel?: string;
    onRangeChange?: (range: TrendRange) => void | Promise<void>;
  };

  let {
    current = null,
    temperatureTrend = [],
    pressureTrend = [],
    humidityTrend = [],
    selectedRange = 'today',
    rangeLabel = 'dnešek',
    onRangeChange
  }: Props = $props();

  let selectedMetric = $state<TrendMetric>('temperature');

  const activeTrend = $derived(
    selectedMetric === 'temperature'
      ? {
          title: 'Teplota',
          description: 'Vývoj teploty',
          values: temperatureTrend,
          currentValue: current?.temperature ?? null,
          unit: '°C',
          color: '#2563eb',
          areaColor: '#2563eb'
        }
      : selectedMetric === 'pressure'
        ? {
            title: 'Tlak',
            description: 'Vývoj tlaku',
            values: pressureTrend,
            currentValue: current?.pressure ?? null,
            unit: 'hPa',
            color: '#7c3aed',
            areaColor: '#7c3aed'
          }
        : {
            title: 'Vlhkost',
            description: 'Vývoj vlhkosti',
            values: humidityTrend,
            currentValue: current?.humidity ?? null,
            unit: '%',
            color: '#0891b2',
            areaColor: '#0891b2'
          }
  );

  function metricTabClass(metric: TrendMetric): string {
    if (selectedMetric !== metric) {
      return 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50';
    }

    if (metric === 'temperature') return 'bg-blue-600 text-white shadow-sm';
    if (metric === 'pressure') return 'bg-violet-600 text-white shadow-sm';
    return 'bg-cyan-600 text-white shadow-sm';
  }

  function rangeTabClass(range: TrendRange): string {
    return selectedRange === range
      ? 'bg-slate-900 text-white shadow-sm'
      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50';
  }

  async function changeRange(range: TrendRange) {
    if (range === selectedRange) return;
    await onRangeChange?.(range);
  }
</script>

<div class="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
  <div class="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
    <div>
      <h2 class="text-base font-semibold">Rychlý přehled</h2>
      <p class="text-sm text-slate-500">{activeTrend.description} · {rangeLabel}</p>
    </div>

    <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div class="inline-flex gap-2 rounded-2xl bg-slate-100 p-1.5">
        <button
          type="button"
          class={`rounded-xl px-4 py-2 text-sm font-semibold transition ${metricTabClass('temperature')}`}
          onclick={() => (selectedMetric = 'temperature')}
        >
          Teplota
        </button>
        <button
          type="button"
          class={`rounded-xl px-4 py-2 text-sm font-semibold transition ${metricTabClass('pressure')}`}
          onclick={() => (selectedMetric = 'pressure')}
        >
          Tlak
        </button>
        <button
          type="button"
          class={`rounded-xl px-4 py-2 text-sm font-semibold transition ${metricTabClass('humidity')}`}
          onclick={() => (selectedMetric = 'humidity')}
        >
          Vlhkost
        </button>
      </div>

      <div class="inline-flex gap-2 rounded-2xl bg-slate-100 p-1.5">
        <button type="button" class={`rounded-xl px-4 py-2 text-sm font-semibold transition ${rangeTabClass('today')}`} onclick={() => changeRange('today')}>
          Dnes
        </button>
        <button type="button" class={`rounded-xl px-4 py-2 text-sm font-semibold transition ${rangeTabClass('yesterday')}`} onclick={() => changeRange('yesterday')}>
          Včera
        </button>
        <button type="button" class={`rounded-xl px-4 py-2 text-sm font-semibold transition ${rangeTabClass('week')}`} onclick={() => changeRange('week')}>
          Týden
        </button>
        <button type="button" class={`rounded-xl px-4 py-2 text-sm font-semibold transition ${rangeTabClass('month')}`} onclick={() => changeRange('month')}>
          Měsíc
        </button>
      </div>
    </div>
  </div>

  <div class="rounded-3xl border border-slate-100 bg-slate-50/70 p-5 shadow-sm">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <p class="text-sm font-medium text-slate-700">{activeTrend.title}</p>
        <p class="text-xs text-slate-500">Aktivní metrika grafu</p>
      </div>
      <span class="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-100">
        {activeTrend.currentValue ?? '-'} {activeTrend.unit}
      </span>
    </div>

    {#if activeTrend.values.length > 0}
      <Layerchart
        values={activeTrend.values}
        unit={activeTrend.unit}
        color={activeTrend.color}
        areaColor={activeTrend.areaColor}
        range={selectedRange}
        rangeLabel={rangeLabel}
      />
    {:else}
      <div class="grid h-[280px] place-items-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
        Bez dat pro vybrané období
      </div>
    {/if}
  </div>
</div>
