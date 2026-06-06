import type { Role } from '$lib/types/common';

/** The authenticated user as returned by the auth endpoints. */
export interface AuthUser {
	id: number;
	email: string;
	nickname: string;
	role: Role;
	createdAt?: string;
	updatedAt?: string;
}

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface RegisterFromInvitePayload {
	token: string;
	nickname: string;
	password: string;
}
