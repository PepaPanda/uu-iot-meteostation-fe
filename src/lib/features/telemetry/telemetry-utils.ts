import type {
	MetricKey,
	Telemetry,
	TelemetryBucket,
	TrendBucketSize,
	TrendDirection,
	TrendPoint,
	TrendRange
} from './telemetry-types';

const TIME_ZONE = 'Europe/Prague';
const DAY_MS = 24 * 60 * 60 * 1000;

interface MetricMeta {
	key: MetricKey;
	label: string;
	unit: string;
	decimals: number;
	color: string;
	areaColor: string;
}

const METRIC_META: Record<MetricKey, MetricMeta> = {
	temperature: {
		key: 'temperature',
		label: 'Teplota',
		unit: '°C',
		decimals: 1,
		color: '#ef4444',
		areaColor: 'rgba(239, 68, 68, 0.12)'
	},
	pressure: {
		key: 'pressure',
		label: 'Tlak',
		unit: 'hPa',
		decimals: 0,
		color: '#8b5cf6',
		areaColor: 'rgba(139, 92, 246, 0.12)'
	},
	humidity: {
		key: 'humidity',
		label: 'Vlhkost',
		unit: '%',
		decimals: 0,
		color: '#2563eb',
		areaColor: 'rgba(37, 99, 235, 0.12)'
	}
};

export function metricMeta(metric: MetricKey): MetricMeta {
	return METRIC_META[metric];
}

export function allMetrics(): MetricMeta[] {
	return [METRIC_META.temperature, METRIC_META.pressure, METRIC_META.humidity];
}

interface TrendDirectionMeta {
	label: string;
	symbol: string;
	color: string;
}

const TREND_DIRECTION_META: Record<TrendDirection, TrendDirectionMeta> = {
	rising: { label: 'Stoupá', symbol: '↑', color: '#dc2626' },
	falling: { label: 'Klesá', symbol: '↓', color: '#2563eb' },
	stable: { label: 'Stabilní', symbol: '→', color: '#64748b' }
};

export function trendDirectionMeta(direction: TrendDirection): TrendDirectionMeta {
	return TREND_DIRECTION_META[direction] ?? TREND_DIRECTION_META.stable;
}

interface RangeMeta {
	value: TrendRange;
	label: string;
}

const RANGE_META: RangeMeta[] = [
	{ value: 'today', label: 'Dnes' },
	{ value: 'yesterday', label: 'Včera' },
	{ value: 'week', label: 'Týden' },
	{ value: 'month', label: 'Měsíc' }
];

export function allRanges(): RangeMeta[] {
	return RANGE_META;
}

/** Computes the offset (ms) between a time zone's local time and UTC for an instant. */
function timeZoneOffsetMs(date: Date, timeZone: string): number {
	const dtf = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hourCycle: 'h23',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});

	const parts = dtf.formatToParts(date);
	const map: Record<string, number> = {};
	for (const part of parts) {
		if (part.type !== 'literal') map[part.type] = Number(part.value);
	}

	const asUtc = Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second);
	return asUtc - date.getTime();
}

/** Returns the instant of midnight (start of day) in the configured time zone. */
function zonedDayStart(date: Date): Date {
	const dateParts = new Intl.DateTimeFormat('en-CA', {
		timeZone: TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(date);

	const [year, month, day] = dateParts.split('-').map(Number);
	const utcGuess = Date.UTC(year, month - 1, day, 0, 0, 0);
	const offset = timeZoneOffsetMs(new Date(utcGuess), TIME_ZONE);
	return new Date(utcGuess - offset);
}

export interface ResolvedRange {
	from: string;
	to: string;
	/** Bucket size for the trends endpoint, or `null` to use raw history. */
	bucket: TrendBucketSize | null;
}

/** Resolves a UI range selection into a concrete from/to window and bucket. */
export function resolveRange(range: TrendRange, now: Date = new Date()): ResolvedRange {
	const todayStart = zonedDayStart(now);

	switch (range) {
		case 'today':
			return { from: todayStart.toISOString(), to: now.toISOString(), bucket: null };
		case 'yesterday': {
			const yesterdayStart = new Date(todayStart.getTime() - DAY_MS);
			return {
				from: yesterdayStart.toISOString(),
				to: todayStart.toISOString(),
				bucket: null
			};
		}
		case 'week':
			return {
				from: new Date(now.getTime() - 7 * DAY_MS).toISOString(),
				to: now.toISOString(),
				bucket: '6h'
			};
		case 'month':
			return {
				from: new Date(now.getTime() - 30 * DAY_MS).toISOString(),
				to: now.toISOString(),
				bucket: '1d'
			};
	}
}

/** Reduces a series to at most `maxPoints` evenly-spaced points. */
export function downsample(points: TrendPoint[], maxPoints = 160): TrendPoint[] {
	if (points.length <= maxPoints) return points;

	const step = points.length / maxPoints;
	const result: TrendPoint[] = [];
	for (let i = 0; i < maxPoints; i++) {
		result.push(points[Math.floor(i * step)]);
	}
	// Always keep the most recent point.
	const last = points[points.length - 1];
	if (result[result.length - 1] !== last) result.push(last);
	return result;
}

/** Extracts chart points for a metric from raw telemetry history (ascending). */
export function historyToPoints(telemetries: Telemetry[], metric: MetricKey): TrendPoint[] {
	return telemetries
		.map((t) => ({ value: t[metric], time: t.measuredAtUtc }))
		.filter((p) => typeof p.value === 'number' && !Number.isNaN(p.value));
}

const BUCKET_METRIC_FIELD: Record<MetricKey, keyof TelemetryBucket> = {
	temperature: 'avgTemperature',
	pressure: 'avgPressure',
	humidity: 'avgHumidity'
};

/** Extracts chart points for a metric from bucketed trends data. */
export function bucketsToPoints(buckets: TelemetryBucket[], metric: MetricKey): TrendPoint[] {
	const field = BUCKET_METRIC_FIELD[metric];
	return buckets
		.map((b) => ({ value: b[field] as number, time: b.bucketStartUtc }))
		.filter((p) => typeof p.value === 'number' && !Number.isNaN(p.value));
}
