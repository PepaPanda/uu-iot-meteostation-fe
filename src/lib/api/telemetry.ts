import { API_BASE } from '$lib/config';
import { api } from './client';
import type { Telemetry } from '$lib/types';

type TrendsResponse = {
  buckets?: Array<{
    bucketStartUtc: string;
    avgTemperature: number | null;
    avgPressure: number | null;
    avgHumidity: number | null;
    avgLighting: number | null;
    sumRaindropsAmount: number;
  }>;
  items?: any[];
};

export async function getCurrentTelemetry(gatewayId: string) {
  const telemetry = await api<Telemetry>(`/api/telemetry/current/${gatewayId}`);
  return { telemetry };
}

export async function getTelemetryHistory(gatewayId: string, from: string, to: string, limit = 500) {
  const data = await api<Telemetry[] | { items: Telemetry[] }>(`/api/telemetry/history/${gatewayId}`, {
    method: 'POST',
    body: JSON.stringify({ from, to, limit })
  });

  return Array.isArray(data) ? { items: data } : data;
}

export async function getTelemetryTrends(gatewayId: string, from: string, to: string, bucket = '1h') {
  const data = await api<TrendsResponse>(`/api/telemetry/trends/${gatewayId}`, {
    method: 'POST',
    body: JSON.stringify({ from, to, bucket })
  });

  return { items: data.buckets ?? data.items ?? [] };
}

export function createTelemetryStream(gatewayId: string) {
  return new EventSource(`${API_BASE}/api/telemetry/stream/${gatewayId}`, {
    withCredentials: true
  });
}
