import { api } from './client';
import type { Role, User } from '$lib/types';

export async function listUsers() {
  return api<{ items: User[]; pageInfo: { page: number; pageSize: number; total: number } }>('/api/users');
}

export async function updateUserRole(userId: string, role: Role) {
  return api<{ user: { id: string; role: Role; updatedAt: string } }>(`/api/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  });
}

export async function createInvite(email: string, role: Role) {
  return api<{ invite: any; token: string }>('/api/users/invites', {
    method: 'POST',
    body: JSON.stringify({ email, role })
  });
}
