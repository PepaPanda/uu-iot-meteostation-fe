import type { GatewayStatus } from './gateway-types';

interface StatusMeta {
	label: string;
	/** Hex color used for map markers and dots. */
	color: string;
}

const STATUS_META: Record<GatewayStatus, StatusMeta> = {
	online: { label: 'Online', color: '#059669' },
	offline: { label: 'Offline', color: '#dc2626' },
	unknown: { label: 'Neznámý', color: '#64748b' }
};

export function gatewayStatusLabel(status: GatewayStatus): string {
	return STATUS_META[status]?.label ?? STATUS_META.unknown.label;
}

export function gatewayStatusColor(status: GatewayStatus): string {
	return STATUS_META[status]?.color ?? STATUS_META.unknown.color;
}
