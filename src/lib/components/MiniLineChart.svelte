<script lang="ts">
  type Props = {
    values?: number[];
    height?: number;
    unit?: string;
  };

  let { values = [], height = 220, unit = '' }: Props = $props();

  const padding = 36;
  const width = 520;

  let cleanValues = $derived(
          values.filter((v) => typeof v === 'number' && Number.isFinite(v))
  );

  let min = $derived(cleanValues.length ? Math.min(...cleanValues) : 0);
  let max = $derived(cleanValues.length ? Math.max(...cleanValues) : 1);
  let range = $derived(max - min || 1);

  let points = $derived(
          cleanValues.map((value, index) => {
            const x =
                    padding +
                    (index / Math.max(cleanValues.length - 1, 1)) * (width - padding * 2);

            const y =
                    height -
                    padding -
                    ((value - min) / range) * (height - padding * 2);

            return { x, y, value };
          })
  );

  let path = $derived(
          points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  );

  let yLabels = $derived([
    max,
    min + range / 2,
    min
  ]);
</script>

<div class="w-full overflow-hidden">
  <svg viewBox={`0 0 ${width} ${height}`} class="h-[220px] w-full">
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
        <text
                x="4"
                y={y + 4}
                class="fill-slate-600 text-[13px] font-medium"
        >
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

      {#each points as point}
        <circle
                cx={point.x}
                cy={point.y}
                r="3.5"
                class="fill-blue-600"
        />
      {/each}

      <text x={padding} y={height - 8} class="fill-slate-600 text-[13px] font-medium">
        -24 h
      </text>
      <text x={width - padding - 32} y={height - 8} class="fill-slate-600 text-[13px] font-medium">
        teď
      </text>
    {:else}
      <text x="50%" y="50%" text-anchor="middle" class="fill-slate-600 text-base font-semibold">
        Bez dat
      </text>
    {/if}
  </svg>
</div>