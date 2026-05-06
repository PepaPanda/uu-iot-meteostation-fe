import { api } from './client';
import type { NotificationItem } from '$lib/types';

export async function listNotifications(onlyUnacknowledged = false) {
  const qs = onlyUnacknowledged ? '?onlyUnacknowledged=true' : '';
  return api<{ items: NotificationItem[] }>(`/api/notifications${qs}`);
}

export async function acknowledgeNotification(id: string) {
  return api<{ notificationId: string; acknowledged: true }>(`/api/notifications/${id}/acknowledge`, {
    method: 'POST'
  });
}
