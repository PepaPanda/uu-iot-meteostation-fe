import { api } from './client';
import type { Gateway } from '$lib/types';

type BackendGateway = {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
};

type ListGatewaysResponse = {
  gateways: BackendGateway[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

function mapGateway(g: BackendGateway): Gateway {
  return {
    id: String(g.id),
    name: g.name,
    description: g.description ?? '',
    location: g.location ?? '',
    latitude: g.latitude ?? 0,
    longitude: g.longitude ?? 0,
    status: 'unknown',
    lastTelemetryReceivedAt: null
  };
}

export async function listGateways(params?: {

  page?: number;

  pageSize?: number;

  search?: string;

}) {

  const data = await api<ListGatewaysResponse>('/api/gateways/list', {

    method: 'POST',

    body: JSON.stringify({

      page: params?.page ?? 1,

      pageSize: params?.pageSize ?? 20,

      search: params?.search

    })

  });

  return {

    items: data.gateways.map(mapGateway),

    pagination: data.pagination

  };

}

export async function getGatewayHealth(id: string) {
  return api<{
    gatewayId: number;
    status: string;
    lastTelemetryAtUtc: string | null;
    nodeBatteryLevel: number | null;
    nodeWifiStrength: number | null;
  }>(`/api/gateways/${id}/health`);
}

export async function getGateway(id: string) {
  const g = await api<BackendGateway>(`/api/gateways/${id}`);
  return { gateway: mapGateway(g) };
}

export async function createGateway(input: {
  name: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}) {
  return api<{
    gateway: BackendGateway;
    secret?: string;
    gatewayToken?: string;
  }>('/api/gateways', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}