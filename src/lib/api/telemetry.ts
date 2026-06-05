import { API_BASE } from '$lib/config';
import { api } from './client';
import type { Telemetry, TelemetryPrediction } from '$lib/types';

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

function normalizeTelemetryRecord(item: unknown): Telemetry {
  const record = item as Record<string, unknown>;

  return {
    ...(record as Telemetry),
    id: record.id as Telemetry['id'],
    remoteId: (record.remoteId ?? record.remote_id) as Telemetry['remoteId'],
    gatewayId: (record.gatewayId ?? record.gateway_id) as Telemetry['gatewayId'],
    measuredAtUtc: (record.measuredAtUtc ?? record.measured_at_utc ?? record.measured_at) as Telemetry['measuredAtUtc'],
    receivedAtUtc: (record.receivedAtUtc ?? record.received_at_utc ?? record.received_at ?? record.createdAt ?? record.created_at) as Telemetry['receivedAtUtc'],
    temperature: (record.temperature ?? record.temp) as Telemetry['temperature'],
    pressure: (record.pressure ?? record.pressure_hpa) as Telemetry['pressure'],
    humidity: record.humidity as Telemetry['humidity'],
    lighting: (record.lighting ?? record.light ?? record.lux) as Telemetry['lighting'],
    raindropsAmount: (record.raindropsAmount ?? record.raindrops_amount) as Telemetry['raindropsAmount']
  };
}

export async function getCurrentTelemetry(gatewayId: string) {
  const telemetry = await api<Telemetry>(`/api/telemetry/current/${gatewayId}`);
  return { telemetry: normalizeTelemetryRecord(telemetry) };
}

export async function getTelemetryHistory(gatewayId: string, from: string, to: string, limit = 500) {
  const data = await api<
    | Telemetry[]
    | {
        items?: Telemetry[];
        telemetries?: Telemetry[];
        history?: Telemetry[];
        data?: Telemetry[];
      }
  >(`/api/telemetry/history/${gatewayId}`, {
    method: 'POST',
    body: JSON.stringify({ from, to, limit })
  });

  const items = Array.isArray(data)
    ? data
    : Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.telemetries)
        ? data.telemetries
        : Array.isArray(data.history)
          ? data.history
          : Array.isArray(data.data)
            ? data.data
            : [];

  return { items: items.map(normalizeTelemetryRecord) };
}

export async function getTelemetryTrends(gatewayId: string, from: string, to: string, bucket = '1h') {
  const data = await api<TrendsResponse>(`/api/telemetry/trends/${gatewayId}`, {
    method: 'POST',
    body: JSON.stringify({ from, to, bucket })
  });

  return { items: data.buckets ?? data.items ?? [] };
}

export async function getTelemetryPrediction(gatewayId: string) {
  return api<TelemetryPrediction>(`/api/telemetry/prediction/${gatewayId}`);
}

export function createTelemetryStream(gatewayId: string) {
  return new EventSource(`${API_BASE}/api/telemetry/stream/${gatewayId}`, {
    withCredentials: true
  });
}
