import { apiFetch } from '$lib/api/client';
import type { AcknowledgeResult, NotificationListResult } from './notification-types';

export function listNotifications(onlyUnacknowledged = false): Promise<NotificationListResult> {
	return apiFetch<NotificationListResult>('/api/notifications/list', {
		method: 'POST',
		body: { onlyUnacknowledged }
	});
}

export function acknowledgeNotification(id: number): Promise<AcknowledgeResult> {
	return apiFetch<AcknowledgeResult>(`/api/notifications/${id}/acknowledge`, {
		method: 'POST'
	});
}
