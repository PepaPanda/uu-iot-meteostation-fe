import type { Pagination, Role } from '$lib/types/common';

export interface User {
	id: number;
	email: string;
	role: Role;
	nickname: string;
	createdAt: string;
	registeredAt: string;
	updatedAt: string;
}

export interface UserListResult {
	users: User[];
	pagination: Pagination;
}

export interface ListUsersParams {
	page?: number;
	pageSize?: number;
	role?: Role;
	search?: string;
}

export interface InviteResult {
	invitationPlainToken: string;
}

export interface UpdateRoleResult {
	id: number;
	role: Role;
	updatedAt: string;
}

export interface UpdateProfilePayload {
	email: string;
	nickname: string;
}
