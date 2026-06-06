import { apiFetch } from '$lib/api/client';
import type { AuthUser, LoginCredentials, RegisterFromInvitePayload } from './auth-types';

/** Logs in with email/password. The session cookie is set by the backend. */
export function login(credentials: LoginCredentials): Promise<AuthUser> {
	return apiFetch<AuthUser>('/api/auth/login', {
		method: 'POST',
		body: credentials
	});
}

/** Ends the current session. */
export function logout(): Promise<void> {
	return apiFetch<void>('/api/auth/logout', { method: 'POST' });
}

/** Returns the currently authenticated user, or throws `ApiError(401)`. */
export function fetchCurrentUser(): Promise<AuthUser> {
	return apiFetch<AuthUser>('/api/auth/me');
}

/** Completes registration from an invitation token. */
export function registerFromInvite(payload: RegisterFromInvitePayload): Promise<AuthUser> {
	return apiFetch<AuthUser>('/api/auth/register-from-invite', {
		method: 'POST',
		body: payload
	});
}
