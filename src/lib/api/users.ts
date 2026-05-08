import { api } from './client';
import type { Role, User } from '$lib/types';

type BackendUser = {
  id?: string | number;
  userId?: string | number;
  email: string;
  nickname?: string | null;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
  registeredAt?: string;
};

type ListUsersResponse = {
  users?: BackendUser[];
  items?: BackendUser[];
  pagination?: {
    page: number;
    pageSize: number;
    totalCount?: number;
    totalPages?: number;
  };
  pageInfo?: {
    page: number;
    pageSize: number;
    total: number;
  };
};

function mapUser(user: BackendUser): User {
  const id = user.id ?? user.userId;

  return {
    id: String(id ?? ''),
    email: user.email,
    nickname: user.nickname ?? '',
    role: user.role,
    createdAt: user.createdAt ?? '',
    updatedAt: user.updatedAt ?? '',
    registeredAt: user.registeredAt ?? user.createdAt ?? ''
  };
}

export async function listUsers(params?: {
  page?: number;
  pageSize?: number;
  role?: Role;
  search?: string;
}) {
  const data = await api<ListUsersResponse>('/api/users/list', {
    method: 'POST',
    body: JSON.stringify({
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      role: params?.role,
      search: params?.search
    })
  });

  const users = data.users ?? data.items ?? [];

  return {
    items: users.map(mapUser).filter((user) => user.id),
    pageInfo: data.pageInfo ?? {
      page: data.pagination?.page ?? params?.page ?? 1,
      pageSize: data.pagination?.pageSize ?? params?.pageSize ?? 20,
      total: data.pagination?.totalCount ?? users.length
    }
  };
}

export async function updateUserRole(userId: string, role: Role) {
  return api<{ id?: string; userId?: string; role: Role; updatedAt?: string }>(`/api/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  });
}

export async function createInvite(email: string) {
  return api<{ invitationPlainToken?: string; token?: string }>('/api/users/invite', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export async function deleteUser(userId: string) {
  return api<void>(`/api/users/${userId}`, {
    method: 'DELETE'
  });
}

export async function changePassword(password: string) {
  return api<void>('/api/users/change-password', {
    method: 'PATCH',
    body: JSON.stringify({ password })
  });
}

export async function resetUserPassword(userId: string, password: string) {
  return api<void>(`/api/users/${userId}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password })
  });
}
