<script lang="ts">
  type ChartPoint = {
    value: number;
    label?: string;
    time?: string;
  };

  type ChartRange = 'today' | 'yesterday' | 'week' | 'month';

  type Props = {
    values?: Array<number | ChartPoint>;
    height?: number;
    unit?: string;
    color?: string;
    areaColor?: string;
    rangeLabel?: string;
    range?: ChartRange;
  };

  let {
    values = [],
    height = 360,
    unit = '',
    color = '#2563eb',
    areaColor = '#2563eb',
    rangeLabel: _rangeLabel = 'posledních 24 h',
    range = 'today'
  }: Props = $props();

  let hoveredIndex = $state<number | null>(null);

  const width = 960;
  const paddingLeft = 64;
  const paddingRight = 32;
  const paddingTop = 40;
  const paddingBottom = 58;
  const DISPLAY_TIME_ZONE = 'UTC';

  function toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  function parseTelemetryDate(value: string): Date {
    const trimmed = value.trim();
    const normalized = trimmed.includes(' ') && !trimmed.includes('T')
      ? trimmed.replace(' ', 'T').replace(/\s+([+-]\d{2}:?\d{2})$/, '$1')
      : trimmed.replace(/\s+([+-]\d{2}:?\d{2})$/, '$1');

    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalized);
    return new Date(hasTimezone ? normalized : `${normalized}Z`);
  }

  function dayShortcut(date: Date): string {
    return new Intl.DateTimeFormat('cs-CZ', {
      weekday: 'short',
      timeZone: DISPLAY_TIME_ZONE
    })
      .format(date)
      .replace('.', '');
  }

  function dateLabel(date: Date): string {
    return date.toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      timeZone: DISPLAY_TIME_ZONE
    });
  }

  function hourLabel(date: Date): string {
    return date.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: DISPLAY_TIME_ZONE
    });
  }

  function preciseTimeLabel(date: Date): string {
    return date.toLocaleString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: DISPLAY_TIME_ZONE
    });
  }

  function formatLabelForRange(date: Date): string {
    if (range === 'week') return `${dayShortcut(date)} ${dateLabel(date)}`;
    if (range === 'month') return dateLabel(date);
    return hourLabel(date);
  }

  function fallbackDate(index: number, total: number): Date {
    const end = new Date();
    const start = new Date(end);

    if (range === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (range === 'yesterday') {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (range === 'week') {
      start.setDate(start.getDate() - 7);
    } else {
      start.setMonth(start.getMonth() - 1);
    }

    const ratio = total <= 1 ? 1 : index / (total - 1);
    return new Date(start.getTime() + ratio * (end.getTime() - start.getTime()));
  }

  const chartData = $derived(
    values
      .map((item, index) => {
        if (typeof item === 'number') {
          const date = fallbackDate(index, values.length);
          return {
            value: item,
            timestamp: date.getTime(),
            label: formatLabelForRange(date),
            tooltipLabel: preciseTimeLabel(date)
          };
        }
        const value = toNumber(item.value);
        if (value === null) return null;
        const date = item.time ? parseTelemetryDate(item.time) : fallbackDate(index, values.length);
        if (Number.isNaN(date.getTime())) return null;
        return {
          value,
          timestamp: date.getTime(),
          label: item.label ?? formatLabelForRange(date),
          tooltipLabel: preciseTimeLabel(date)
        };
      })
      .filter((item): item is { value: number; timestamp: number; label: string; tooltipLabel: string } => item !== null)
      .sort((a, b) => a.timestamp - b.timestamp)
  );

  const rawMin = $derived(chartData.length ? Math.min(...chartData.map((point) => point.value)) : 0);
  const rawMax = $derived(chartData.length ? Math.max(...chartData.map((point) => point.value)) : 1);
  const rawRange = $derived(rawMax - rawMin || 1);

  const minValue = $derived(Math.floor((rawMin - rawRange * 0.2) / 2) * 2);
  const maxValue = $derived(Math.ceil((rawMax + rawRange * 0.2) / 2) * 2);
  const valueRange = $derived(maxValue - minValue || 1);

  const minTimestamp = $derived(chartData.length ? chartData[0].timestamp : Date.now());
  const maxTimestamp = $derived(chartData.length ? chartData[chartData.length - 1].timestamp : minTimestamp + 1);
  const timestampRange = $derived(maxTimestamp - minTimestamp || 1);

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = $derived(height - paddingTop - paddingBottom);
  const baselineY = $derived(height - paddingBottom);

  const points = $derived(
    chartData.map((point) => {
      const x = paddingLeft + ((point.timestamp - minTimestamp) / timestampRange) * plotWidth;
      const y = baselineY - ((point.value - minValue) / valueRange) * plotHeight;
      return { ...point, x, y };
    })
  );

  const hoveredPoint = $derived(
    hoveredIndex === null ? null : points[hoveredIndex] ?? null
  );

  const yTicks = $derived(
    Array.from({ length: 6 }, (_, index) => {
      const value = minValue + (valueRange / 5) * index;
      const y = baselineY - ((value - minValue) / valueRange) * plotHeight;
      return { value, y };
    }).reverse()
  );

  const xTicks = $derived(
    (() => {
      const tickCount = range === 'week' ? 7 : range === 'month' ? 6 : 8;
      if (!chartData.length) return [];
      return Array.from({ length: tickCount }, (_, tickIndex) => {
        const ratio = tickCount <= 1 ? 1 : tickIndex / (tickCount - 1);
        const timestamp = minTimestamp + ratio * timestampRange;
        const date = new Date(timestamp);
        return {
          x: paddingLeft + ratio * plotWidth,
          label: formatLabelForRange(date)
        };
      });
    })()
  );

  function buildLinePath(items: typeof points): string {
    if (items.length === 0) return '';
    if (items.length === 1) return `M ${items[0].x} ${items[0].y}`;
    let path = `M ${items[0].x} ${items[0].y}`;
    for (let index = 1; index < items.length; index += 1) {
      path += ` L ${items[index].x} ${items[index].y}`;
    }
    return path;
  }

  const linePath = $derived(buildLinePath(points));
  const areaPath = $derived(
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
      : ''
  );

  function formatValue(value: number | null | undefined, decimals = 1): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    return `${value.toFixed(decimals)}${unit}`;
  }
</script>

{#if points.length > 0}
  <div
    class="relative w-full overflow-hidden rounded-[1.75rem] bg-white"
    style={`height: ${height}px`}
    role="presentation"
    on:mouseleave={() => (hoveredIndex = null)}
  >
    <svg class="h-full w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img">
      <defs>
        <linearGradient id="chart-area-gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color={areaColor} stop-opacity="0.18" />
          <stop offset="100%" stop-color={areaColor} stop-opacity="0.03" />
        </linearGradient>
      </defs>

      {#each yTicks as tick}
        <line
          x1={paddingLeft}
          x2={width - paddingRight}
          y1={tick.y}
          y2={tick.y}
          stroke="currentColor"
          stroke-dasharray="5 6"
          stroke-width="1"
          class="text-slate-200"
        />
        <text
          x={paddingLeft - 20}
          y={tick.y + 5}
          text-anchor="end"
          class="fill-slate-500 text-[13px] font-semibold"
        >
          {tick.value.toFixed(0)}
        </text>
      {/each}

      <text x={paddingLeft - 20} y={paddingTop - 16} class="fill-slate-500 text-[13px] font-semibold">
        {unit}
      </text>

      <line
        x1={paddingLeft}
        x2={width - paddingRight}
        y1={baselineY}
        y2={baselineY}
        stroke="currentColor"
        stroke-width="1"
        class="text-slate-300"
      />

      <path d={areaPath} fill="url(#chart-area-gradient)" />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />

      {#each points as point, index}
        <circle
          cx={point.x}
          cy={point.y}
          r={hoveredIndex === index ? 5 : 3}
          fill="white"
          stroke={color}
          stroke-width="2"
          vector-effect="non-scaling-stroke"
        />
        <circle
          cx={point.x}
          cy={point.y}
          r="14"
          fill="transparent"
          role="presentation"
          on:pointerenter={() => (hoveredIndex = index)}
          on:focus={() => (hoveredIndex = index)}
        />
      {/each}

      {#each xTicks as tick}
        <line
          x1={tick.x}
          x2={tick.x}
          y1={baselineY}
          y2={baselineY + 6}
          stroke="currentColor"
          stroke-width="1"
          class="text-slate-300"
        />
        <text
          x={tick.x}
          y={baselineY + 24}
          text-anchor="middle"
          class="fill-slate-600 text-[12px] font-semibold"
        >
          {tick.label}
        </text>
      {/each}
    </svg>

    {#if hoveredPoint}
      <div
        class="pointer-events-none absolute z-20 min-w-[170px] rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 text-sm shadow-xl backdrop-blur"
        style={`left: ${Math.min(Math.max((hoveredPoint.x / width) * 100, 8), 78)}%; top: ${Math.max((hoveredPoint.y / height) * 100 - 18, 4)}%;`}
      >
        <p class="text-xs font-medium text-slate-500">Čas: {hoveredPoint.tooltipLabel}</p>
        <p class="mt-1 font-bold text-slate-950">Hodnota: {formatValue(hoveredPoint.value)}</p>
      </div>
    {/if}
  </div>
{:else}
  <div class="grid h-[280px] place-items-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
    Bez dat za posledních 24 h
  </div>
{/if}