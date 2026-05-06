<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { createInvite, listUsers, updateUserRole } from '$lib/api/users';
  import type { Role, User } from '$lib/types';

  let users: User[] = [];
  let inviteEmail = '';
  let inviteRole: Role = 'guest';
  let createdToken = '';

  async function load() {
    users = (await listUsers()).items;
  }

  async function changeRole(userId: string, role: Role) {
    await updateUserRole(userId, role);
    await load();
  }

  async function invite() {
    const res = await createInvite(inviteEmail, inviteRole);
    createdToken = res.token;
    inviteEmail = '';
  }

  onMount(load);
</script>

<div class="min-h-screen bg-slate-100">
  <Sidebar />

  <main class="lg:pl-64">
    <div class="mx-auto max-w-7xl px-4 py-6">
      <h1 class="mb-6 text-3xl font-bold">Uživatelé</h1>

      <div class="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 class="mb-4 font-semibold">Pozvat uživatele</h2>
        <form class="flex flex-col gap-3 md:flex-row" on:submit|preventDefault={invite}>
          <input bind:value={inviteEmail} type="email" placeholder="email@example.com" class="rounded-xl border px-3 py-2" />
          <select bind:value={inviteRole} class="rounded-xl border px-3 py-2">
            <option value="guest">guest</option>
            <option value="operator">operator</option>
            <option value="supervisor">supervisor</option>
            <option value="administrator">administrator</option>
          </select>
          <button class="rounded-xl bg-blue-600 px-4 py-2 text-white">Vytvořit invite</button>
        </form>

        {#if createdToken}
          <p class="mt-4 rounded-xl bg-blue-50 p-3 text-sm">Invite token: <code>{createdToken}</code></p>
        {/if}
      </div>

      <div class="rounded-2xl border bg-white p-5 shadow-sm">
        <table class="w-full text-left text-sm">
          <thead class="text-slate-500">
            <tr><th class="py-2">Jméno</th><th>Email</th><th>Role</th><th>Akce</th></tr>
          </thead>
          <tbody>
            {#each users as user}
              <tr class="border-t">
                <td class="py-3">{user.nickname}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <select value={user.role} on:change={(e) => changeRole(user.id, e.currentTarget.value as Role)} class="rounded-xl border px-2 py-1">
                    <option value="guest">guest</option>
                    <option value="operator">operator</option>
                    <option value="supervisor">supervisor</option>
                    <option value="administrator">administrator</option>
                  </select>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </main>
</div>
