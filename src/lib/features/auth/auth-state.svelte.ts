import { ApiError } from '$lib/api/errors';
import type { Role } from '$lib/types/common';
import { hasRole } from '$lib/utils/role';
import * as authApi from './auth-api';
import type { AuthUser, LoginCredentials, RegisterFromInvitePayload } from './auth-types';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

/**
 * Reactive authentication state shared across the app. Replaces the previous
 * writable store with rune-based state.
 */
class AuthState {
	user = $state<AuthUser | null>(null);
	status = $state<AuthStatus>('idle');

	get isAuthenticated(): boolean {
		return this.user !== null;
	}

	get isResolved(): boolean {
		return this.status === 'authenticated' || this.status === 'unauthenticated';
	}

	/** Returns true when the current user is at least `minimum`. */
	can(minimum: Role): boolean {
		return hasRole(this.user?.role, minimum);
	}

	/** Loads the current user from the session cookie, if any. */
	async refresh(): Promise<void> {
		this.status = 'loading';
		try {
			this.user = await authApi.fetchCurrentUser();
			this.status = 'authenticated';
		} catch (error) {
			this.user = null;
			this.status = 'unauthenticated';
			// A 401 simply means "not logged in"; rethrow anything unexpected.
			if (!(error instanceof ApiError) || !error.isUnauthorized) {
				throw error;
			}
		}
	}

	async login(credentials: LoginCredentials): Promise<AuthUser> {
		const user = await authApi.login(credentials);
		this.user = user;
		this.status = 'authenticated';
		return user;
	}

	/** Completes invite registration; the backend logs the user in immediately. */
	async registerFromInvite(payload: RegisterFromInvitePayload): Promise<AuthUser> {
		const user = await authApi.registerFromInvite(payload);
		this.user = user;
		this.status = 'authenticated';
		return user;
	}

	async logout(): Promise<void> {
		try {
			await authApi.logout();
		} finally {
			this.user = null;
			this.status = 'unauthenticated';
		}
	}
}

export const authState = new AuthState();
