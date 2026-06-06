import { apiFetch } from '$lib/api/client';
import type { AuthUser } from '$lib/features/auth/auth-types';
import type { Role } from '$lib/types/common';
import type {
	InviteResult,
	ListUsersParams,
	UpdateProfilePayload,
	UpdateRoleResult,
	UserListResult
} from './user-types';

export function listUsers(params: ListUsersParams = {}): Promise<UserListResult> {
	const { page = 1, pageSize = 20, role, search } = params;
	return apiFetch<UserListResult>('/api/users/list', {
		method: 'POST',
		body: { page, pageSize, role, search }
	});
}

export function updateUserRole(id: number, role: Role): Promise<UpdateRoleResult> {
	return apiFetch<UpdateRoleResult>(`/api/users/${id}/role`, {
		method: 'PATCH',
		body: { role }
	});
}

export function inviteUser(email: string): Promise<InviteResult> {
	return apiFetch<InviteResult>('/api/users/invite', {
		method: 'POST',
		body: { email }
	});
}

export function deleteUser(id: number): Promise<void> {
	return apiFetch<void>(`/api/users/${id}`, { method: 'DELETE' });
}

export function changePassword(password: string): Promise<void> {
	return apiFetch<void>('/api/users/change-password', {
		method: 'PATCH',
		body: { password }
	});
}

export function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
	return apiFetch<AuthUser>('/api/users/update', {
		method: 'PATCH',
		body: payload
	});
}
