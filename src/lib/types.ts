export type Role = 'guest' | 'operator' | 'supervisor' | 'administrator';

export type User = {
  id: string;
  email: string;
  role: Role;
  nickname: string;
  createdAt: string;
  registeredAt: string;
  updatedAt: string;
};

export type Gateway = {
  id: string;
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  lastTelemetryReceivedAt?: string | null;
  status?: 'online' | 'offline' | 'unknown';
};

export type Telemetry = {
  id: string;
  remoteId: string;
  gatewayId: string;
  measuredAtUtc: string;
  receivedAtUtc: string;
  temperature: number;
  pressure: number;
  humidity: number;
  lighting: number;
  raindropsAmount: number;
  nodeBatteryLevel?: number | null;
  nodeWifiStrength?: number | null;
};

export type NotificationItem = {
  id: string;
  type: 'warning' | 'info' | 'danger';
  text: string;
  gatewayId: string | null;
  isForAdminsOnly: boolean;
  acknowledged: boolean;
};
