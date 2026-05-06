import { writable } from 'svelte/store';
import type { User } from '$lib/types';

type AuthState = {
  user: User | null;
};

export const auth = writable<AuthState>({
  user: null
});

export function setAuthUser(user: User): void {
  auth.set({ user });
}

export function clearAuth(): void {
  auth.set({ user: null });
}
