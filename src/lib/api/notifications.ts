import { api } from './client';
import type { NotificationItem } from '$lib/types';

type NotificationsResponse = {
  items?: NotificationItem[];
  notifications?: NotificationItem[];
};

export async function listNotifications(onlyUnacknowledged = false) {
  const data = await api<NotificationsResponse>('/api/notifications/list', {
    method: 'POST',
    body: JSON.stringify({ onlyUnacknowledged })
  });

  return {
    items: data.notifications ?? data.items ?? []
  };
}

export async function acknowledgeNotification(id: string) {
  return api<{ notificationId: string; acknowledged: true }>(`/api/notifications/${id}/acknowledge`, {
    method: 'POST'
  });
}