<script lang="ts">
  type ChartPoint = {
    value: number;
    label?: string;
    time?: string;
  };

  type Props = {
    values?: Array<number | ChartPoint>;
    height?: number;
    unit?: string;
  };

  let { values = [], height = 220, unit = '' }: Props = $props();

  const padding = 44;
  const width = 560;

  let hoveredIndex = $state<number | null>(null);

  function toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  function formatTime(value: string | undefined, index: number): string {
    if (value) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString('cs-CZ', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }

      return value;
    }

    return `Bod ${index + 1}`;
  }

  function fallbackTimeLabel(index: number, total: number): string {
    const now = new Date();
    const start = now.getTime() - 24 * 60 * 60 * 1000;
    const ratio = total <= 1 ? 1 : index / (total - 1);
    const date = new Date(start + ratio * 24 * 60 * 60 * 1000);

    return date.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  let cleanValues = $derived(
    values
      .map((item, index) => {
        if (typeof item === 'number') {
          return {
            value: item,
            label: fallbackTimeLabel(index, values.length)
          };
        }

        const value = toNumber(item.value);
        if (value === null) return null;

        return {
          value,
          label: item.label ?? formatTime(item.time, index),
          time: item.time
        };
      })
      .filter((item): item is { value: number; label: string; time?: string } => item !== null)
  );

  let min = $derived(cleanValues.length ? Math.min(...cleanValues.map((item) => item.value)) : 0);
  let max = $derived(cleanValues.length ? Math.max(...cleanValues.map((item) => item.value)) : 1);
  let range = $derived(max - min || 1);

  let points = $derived(
    cleanValues.map((item, index) => {
      const x = padding + (index / Math.max(cleanValues.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((item.value - min) / range) * (height - padding * 2);

      return {
        ...item,
        x,
        y
      };
    })
  );

  function smoothPath(items: typeof points): string {
    if (items.length === 0) return '';
    if (items.length === 1) return `M ${items[0].x} ${items[0].y}`;

    let d = `M ${items[0].x} ${items[0].y}`;

    for (let i = 0; i < items.length - 1; i += 1) {
      const current = items[i];
      const next = items[i + 1];
      const controlX = (current.x + next.x) / 2;

      d += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }

    return d;
  }

  let path = $derived(smoothPath(points));

  let yLabels = $derived([max, min + range / 2, min]);
  let hoveredPoint = $derived(hoveredIndex === null ? null : points[hoveredIndex] ?? null);
</script>

<div class="relative w-full overflow-hidden">
  <svg
    viewBox={`0 0 ${width} ${height}`}
    class="h-[240px] w-full"
    onmouseleave={() => (hoveredIndex = null)}
  >
    {#if points.length > 0}
      {#each yLabels as label}
        {@const y = height - padding - ((label - min) / range) * (height - padding * 2)}
        <line
          x1={padding}
          x2={width - padding}
          y1={y}
          y2={y}
          stroke="currentColor"
          class="text-slate-200"
          stroke-width="1"
        />
        <text x="4" y={y + 4} class="fill-slate-600 text-[13px] font-medium">
          {label.toFixed(1)}{unit}
        </text>
      {/each}

      <path
        d={path}
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-blue-600"
      />

      {#each points as point, index}
        <circle
          cx={point.x}
          cy={point.y}
          r="14"
          class="fill-transparent"
          onmouseenter={() => (hoveredIndex = index)}
          onfocus={() => (hoveredIndex = index)}
        />
      {/each}

      {#if hoveredPoint}
        <circle
          cx={hoveredPoint.x}
          cy={hoveredPoint.y}
          r="4.5"
          class="fill-blue-600"
        />
      {/if}

    {:else}
      <text x="50%" y="50%" text-anchor="middle" class="fill-slate-600 text-base font-semibold">
        Bez dat
      </text>
    {/if}
  </svg>

  {#if hoveredPoint}
    <div
      class="pointer-events-none absolute z-20 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg"
      style={`left: ${Math.min(Math.max((hoveredPoint.x / width) * 100, 8), 78)}%; top: ${Math.max((hoveredPoint.y / height) * 100 - 22, 4)}%;`}
    >
      <p class="text-xs font-medium text-slate-500">{hoveredPoint.label}</p>
      <p class="mt-1 font-bold text-slate-950">{hoveredPoint.value.toFixed(1)}{unit}</p>
    </div>
  {/if}
</div>