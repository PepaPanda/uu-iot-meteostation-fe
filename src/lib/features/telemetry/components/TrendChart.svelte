<script lang="ts">
	import { formatDate, formatDateTime, formatNumber, formatTime } from '$lib/utils/format';
	import type { TrendPoint } from '../telemetry-types';

	interface Props {
		points: TrendPoint[];
		height?: number;
		unit?: string;
		decimals?: number;
		color?: string;
		areaColor?: string;
	}

	let {
		points,
		height = 260,
		unit = '',
		decimals = 1,
		color = 'var(--color-primary)',
		areaColor = 'rgba(37, 99, 235, 0.12)'
	}: Props = $props();

	const PADDING = { top: 16, right: 18, bottom: 28, left: 46 };

	let width = $state(640);
	let hoverIndex = $state<number | null>(null);

	interface Plotted {
		x: number;
		y: number;
		point: TrendPoint;
	}

	const innerWidth = $derived(Math.max(0, width - PADDING.left - PADDING.right));
	const innerHeight = $derived(Math.max(0, height - PADDING.top - PADDING.bottom));

	const times = $derived(points.map((p) => Date.parse(p.time)));
	const values = $derived(points.map((p) => p.value));

	const xMin = $derived(times.length ? Math.min(...times) : 0);
	const xMax = $derived(times.length ? Math.max(...times) : 1);

	const bounds = $derived.by(() => {
		if (!values.length) return { min: 0, max: 1 };
		let min = Math.min(...values);
		let max = Math.max(...values);
		if (min === max) {
			min -= 1;
			max += 1;
		}
		const pad = (max - min) * 0.08;
		return { min: min - pad, max: max + pad };
	});

	function scaleX(t: number): number {
		if (xMax === xMin) return PADDING.left + innerWidth / 2;
		return PADDING.left + ((t - xMin) / (xMax - xMin)) * innerWidth;
	}

	function scaleY(v: number): number {
		const { min, max } = bounds;
		return PADDING.top + (1 - (v - min) / (max - min)) * innerHeight;
	}

	const plotted = $derived<Plotted[]>(
		points.map((point, i) => ({ x: scaleX(times[i]), y: scaleY(point.value), point }))
	);

	const linePath = $derived(
		plotted.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
	);

	const areaPath = $derived.by(() => {
		if (!plotted.length) return '';
		const baseline = PADDING.top + innerHeight;
		const first = plotted[0];
		const last = plotted[plotted.length - 1];
		return `M${first.x.toFixed(1)},${baseline} ${plotted
			.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`)
			.join(' ')} L${last.x.toFixed(1)},${baseline} Z`;
	});

	const yTicks = $derived.by(() => {
		const { min, max } = bounds;
		const count = 5;
		return Array.from({ length: count }, (_, i) => {
			const value = min + ((max - min) * i) / (count - 1);
			return { value, y: scaleY(value) };
		});
	});

	const spansMultipleDays = $derived(xMax - xMin > 2 * 24 * 60 * 60 * 1000);

	const xTicks = $derived.by(() => {
		if (plotted.length < 2) return [];
		const count = Math.min(5, plotted.length);
		return Array.from({ length: count }, (_, i) => {
			const idx = Math.round((i * (plotted.length - 1)) / (count - 1));
			const p = plotted[idx];
			return {
				x: p.x,
				label: spansMultipleDays ? formatDate(p.point.time) : formatTime(p.point.time)
			};
		});
	});

	function handleMove(event: PointerEvent) {
		if (!plotted.length) return;
		const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * width;
		let nearest = 0;
		let best = Infinity;
		for (let i = 0; i < plotted.length; i++) {
			const dist = Math.abs(plotted[i].x - x);
			if (dist < best) {
				best = dist;
				nearest = i;
			}
		}
		hoverIndex = nearest;
	}

	const hovered = $derived(hoverIndex !== null ? plotted[hoverIndex] : null);
	const tooltipLeft = $derived(hovered ? (hovered.x / width) * 100 : 0);
</script>

<div class="chart" bind:clientWidth={width} style={`height: ${height}px`}>
	{#if points.length === 0}
		<div class="empty">Žádná data k zobrazení</div>
	{:else}
		<svg
			viewBox={`0 0 ${width} ${height}`}
			role="img"
			aria-label="Graf vývoje hodnot"
			onpointermove={handleMove}
			onpointerleave={() => (hoverIndex = null)}
		>
			{#each yTicks as tick (tick.value)}
				<line
					class="grid-line"
					x1={PADDING.left}
					x2={width - PADDING.right}
					y1={tick.y}
					y2={tick.y}
				/>
				<text class="axis-label" x={PADDING.left - 8} y={tick.y + 4} text-anchor="end">
					{formatNumber(tick.value, { decimals })}
				</text>
			{/each}

			{#each xTicks as tick (tick.x)}
				<text class="axis-label" x={tick.x} y={height - 8} text-anchor="middle">
					{tick.label}
				</text>
			{/each}

			<path d={areaPath} fill={areaColor} stroke="none" />
			<path d={linePath} fill="none" stroke={color} stroke-width="2" stroke-linejoin="round" />

			{#if hovered}
				<line
					class="hover-line"
					x1={hovered.x}
					x2={hovered.x}
					y1={PADDING.top}
					y2={height - PADDING.bottom}
				/>
				<circle cx={hovered.x} cy={hovered.y} r="4" fill={color} stroke="#fff" stroke-width="2" />
			{/if}
		</svg>

		{#if hovered}
			<div class="tooltip" style={`left: ${tooltipLeft}%`} class:flip={tooltipLeft > 70}>
				<span class="tooltip-value">{formatNumber(hovered.point.value, { decimals })}{unit}</span>
				<span class="tooltip-time">{formatDateTime(hovered.point.time)}</span>
			</div>
		{/if}
	{/if}
</div>

<style>
	.chart {
		position: relative;
		width: 100%;
	}

	svg {
		width: 100%;
		height: 100%;
		display: block;
	}

	.grid-line {
		stroke: var(--color-border);
		stroke-width: 1;
	}

	.hover-line {
		stroke: var(--color-border-strong);
		stroke-width: 1;
		stroke-dasharray: 3 3;
	}

	.axis-label {
		fill: var(--color-text-subtle);
		font-size: 11px;
	}

	.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--color-text-muted);
		font-size: var(--text-sm);
	}

	.tooltip {
		position: absolute;
		top: 0;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.4rem 0.6rem;
		background-color: var(--color-text);
		color: #fff;
		border-radius: var(--radius-md);
		font-size: var(--text-xs);
		pointer-events: none;
		white-space: nowrap;
		box-shadow: var(--shadow-md);
	}

	.tooltip.flip {
		transform: translateX(-100%);
	}

	.tooltip-value {
		font-weight: 700;
		font-size: var(--text-sm);
	}

	.tooltip-time {
		color: rgb(255 255 255 / 0.75);
	}
</style>
