import { api } from './client';
import { clearAuth, setAuthUser } from '$lib/stores/auth';
import type { User } from '$lib/types';

export async function login(email: string, password: string): Promise<User> {
  const user = await api<User>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password })
  });

  setAuthUser(user);
  return user;
}

export async function logout(): Promise<void> {
  await api<void>('/api/auth/logout', {
    method: 'POST'
  }).catch(() => {
    // Ignore backend logout errors, but always clear local frontend state.
  });

  clearAuth();
}

export async function me(): Promise<User> {
  const user = await api<User>('/api/auth/me');
  setAuthUser(user);
  return user;
}