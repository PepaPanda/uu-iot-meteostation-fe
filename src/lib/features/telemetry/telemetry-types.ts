export interface Telemetry {
	id: number;
	remoteId: number;
	gatewayId: number;
	measuredAtUtc: string;
	receivedAtUtc: string;
	temperature: number;
	pressure: number;
	humidity: number;
	lighting: number;
	raindropsAmount: number;
}

export interface TelemetryHistoryResult {
	telemetries: Telemetry[];
}

export type TrendBucketSize = '15m' | '30m' | '1h' | '6h' | '1d';

export interface TelemetryBucket {
	bucketStartUtc: string;
	avgTemperature: number;
	avgPressure: number;
	avgHumidity: number;
	avgLighting: number;
	sumRaindropsAmount: number;
}

export interface TelemetryTrendsResult {
	buckets: TelemetryBucket[];
}

export type TrendDirection = 'rising' | 'falling' | 'stable';

export interface Prediction {
	generatedAtUtc: string;
	temperatureTrend: TrendDirection;
	pressureTrend: TrendDirection;
	humidityTrend: TrendDirection;
	summary: string;
}

export interface HistoryParams {
	from: string;
	to: string;
	limit?: number;
}

export interface TrendsParams {
	from: string;
	to: string;
	bucket: TrendBucketSize;
}

/** Metrics that can be charted as a continuous trend. */
export type MetricKey = 'temperature' | 'pressure' | 'humidity';

/** Selectable time window for trend charts. */
export type TrendRange = 'today' | 'yesterday' | 'week' | 'month';

/** A single point used by the trend chart. */
export interface TrendPoint {
	value: number;
	time: string;
}
