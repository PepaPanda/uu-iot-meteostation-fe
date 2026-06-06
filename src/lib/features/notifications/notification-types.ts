export type NotificationType = 'warning' | 'info' | 'danger';

export interface AppNotification {
	id: number;
	text: string;
	type: NotificationType;
	gatewayId: number | null;
	isForAdminsOnly: boolean;
	acknowledged: boolean;
	createdAt: string;
}

export interface NotificationListResult {
	notifications: AppNotification[];
}

export interface AcknowledgeResult {
	id: number;
	acknowledged: boolean;
}
