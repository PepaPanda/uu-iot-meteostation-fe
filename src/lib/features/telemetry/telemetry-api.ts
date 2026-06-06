import { apiFetch, apiUrl } from '$lib/api/client';
import type {
	HistoryParams,
	Prediction,
	Telemetry,
	TelemetryHistoryResult,
	TelemetryTrendsResult,
	TrendsParams
} from './telemetry-types';

export function getCurrentTelemetry(gatewayId: number): Promise<Telemetry> {
	return apiFetch<Telemetry>(`/api/telemetry/current/${gatewayId}`);
}

export function getTelemetryHistory(
	gatewayId: number,
	params: HistoryParams
): Promise<TelemetryHistoryResult> {
	return apiFetch<TelemetryHistoryResult>(`/api/telemetry/history/${gatewayId}`, {
		method: 'POST',
		body: params
	});
}

export function getTelemetryTrends(
	gatewayId: number,
	params: TrendsParams
): Promise<TelemetryTrendsResult> {
	return apiFetch<TelemetryTrendsResult>(`/api/telemetry/trends/${gatewayId}`, {
		method: 'POST',
		body: params
	});
}

export function getPrediction(gatewayId: number): Promise<Prediction> {
	return apiFetch<Prediction>(`/api/telemetry/prediction/${gatewayId}`);
}

/** URL of the Server-Sent Events stream of live telemetry for a gateway. */
export function telemetryStreamUrl(gatewayId: number): string {
	return apiUrl(`/api/telemetry/stream/${gatewayId}`);
}
