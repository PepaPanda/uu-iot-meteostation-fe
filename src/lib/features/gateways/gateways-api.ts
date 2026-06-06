import { apiFetch } from '$lib/api/client';
import type {
	CreateGatewayPayload,
	CreateGatewayResult,
	Gateway,
	GatewayHealth,
	GatewayListResult,
	ListGatewaysParams,
	RotateSecretResult,
	UpdateGatewayPayload
} from './gateway-types';

export function listGateways(params: ListGatewaysParams = {}): Promise<GatewayListResult> {
	const { page = 1, pageSize = 50, search } = params;
	return apiFetch<GatewayListResult>('/api/gateways/list', {
		method: 'POST',
		body: { page, pageSize, search }
	});
}

export function getGateway(id: number): Promise<Gateway> {
	return apiFetch<Gateway>(`/api/gateways/${id}`);
}

export function getGatewayHealth(id: number): Promise<GatewayHealth> {
	return apiFetch<GatewayHealth>(`/api/gateways/${id}/health`);
}

export function createGateway(payload: CreateGatewayPayload): Promise<CreateGatewayResult> {
	return apiFetch<CreateGatewayResult>('/api/gateways', {
		method: 'POST',
		body: payload
	});
}

export function updateGateway(id: number, payload: UpdateGatewayPayload): Promise<Gateway> {
	return apiFetch<Gateway>(`/api/gateways/${id}`, {
		method: 'PATCH',
		body: payload
	});
}

export function deleteGateway(id: number): Promise<void> {
	return apiFetch<void>(`/api/gateways/${id}`, { method: 'DELETE' });
}

export function rotateGatewaySecret(id: number): Promise<RotateSecretResult> {
	return apiFetch<RotateSecretResult>(`/api/gateways/${id}/rotate-secret`, {
		method: 'POST'
	});
}
