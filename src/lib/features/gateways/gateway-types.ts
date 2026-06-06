import type { Pagination } from '$lib/types/common';

export interface Gateway {
	id: number;
	name: string;
	description: string;
	location: string;
	latitude: number;
	longitude: number;
}

export type GatewayStatus = 'online' | 'offline' | 'unknown';

export interface GatewayHealth {
	gatewayId: number;
	status: GatewayStatus;
	lastTelemetryAtUtc: string | null;
	nodeBatteryLevel: number | null;
	nodeWifiStrength: number | null;
}

export interface CreateGatewayPayload {
	name: string;
	description: string;
	location: string;
	latitude: number;
	longitude: number;
}

export type UpdateGatewayPayload = Partial<CreateGatewayPayload>;

export interface CreateGatewayResult {
	gateway: Gateway;
	secret: string;
}

export interface RotateSecretResult {
	secret: string;
	gatewayId: number;
}

export interface GatewayListResult {
	gateways: Gateway[];
	pagination: Pagination;
}

export interface ListGatewaysParams {
	page?: number;
	pageSize?: number;
	search?: string;
}
