

import { api } from './client';
import { setAuthUser } from '$lib/stores/auth';
import type { User } from '$lib/types';

type RegisterFromInviteInput = {
  token: string;
  email: string;
  nickname: string;
  password: string;
};

export async function registerFromInvite(input: RegisterFromInviteInput): Promise<User> {
  const user = await api<User>('/api/auth/register-from-invite', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(input)
  });

  setAuthUser(user);
  return user;
}