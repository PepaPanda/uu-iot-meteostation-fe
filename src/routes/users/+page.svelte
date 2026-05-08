<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { changePassword, createInvite, deleteUser, listUsers, resetUserPassword, updateUserRole } from '$lib/api/users';
  import type { Role, User } from '$lib/types';

  let users = $state<User[]>([]);
  let inviteEmail = $state('');
  let createdToken = $state('');
  let newPassword = $state('');
  let passwordMessage = $state('');
  let passwordError = $state('');
  let passwordLoading = $state(false);
  let sidebarCollapsed = $state(false);

  async function load() {
    users = (await listUsers()).items;
  }

  async function changeRole(userId: string, role: Role) {
    await updateUserRole(userId, role);
    await load();
  }

  function handleRoleChange(userId: string, event: Event) {
    const target = event.currentTarget as HTMLSelectElement;
    changeRole(userId, target.value as Role);
  }

  async function removeUser(userId: string) {
    const confirmed = window.confirm('Opravdu chcete odstranit tohoto uživatele?');
    if (!confirmed) return;

    await deleteUser(userId);
    await load();
  }

  async function resetPassword(userId: string) {
    const password = window.prompt('Zadejte nové heslo pro uživatele:');
    if (!password?.trim()) return;

    await resetUserPassword(userId, password);
    window.alert('Heslo uživatele bylo změněno.');
  }

  async function updatePassword() {
    if (!newPassword.trim() || passwordLoading) return;

    const confirmed = window.confirm(
      'Opravdu chcete změnit heslo aktuálního účtu?'
    );

    if (!confirmed) return;

    passwordError = '';
    passwordMessage = '';
    passwordLoading = true;

    try {
      await changePassword('', newPassword);

      passwordMessage = 'Heslo bylo úspěšně změněno.';
      newPassword = '';

      setTimeout(() => {
        passwordMessage = '';
      }, 3000);
    } catch (err) {
      passwordError = err instanceof Error ? err.message : 'Změna hesla selhala.';
    } finally {
      passwordLoading = false;
    }
  }

  async function invite() {
    const res = await createInvite(inviteEmail);
    createdToken = res.invitationPlainToken ?? res.token ?? '';
    inviteEmail = '';
  }

  onMount(() => {
    sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

    const handleSidebarChange = (event: Event) => {
      sidebarCollapsed = (event as CustomEvent<boolean>).detail === true;
    };

    window.addEventListener('sidebar-collapsed-change', handleSidebarChange);
    load();

    return () => {
      window.removeEventListener('sidebar-collapsed-change', handleSidebarChange);
    };
  });
</script>

<div class="min-h-screen bg-slate-100">
  <Sidebar />

  <main class={`transition-[padding] duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
    <div class="mx-auto max-w-[1600px] px-4 pb-24 pt-6 sm:px-8 lg:px-10 lg:pb-6 xl:px-12">
      <div class="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            MeteoTrack Admin
          </p>
          <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Uživatelé
          </h1>
          <p class="mt-2 text-sm text-slate-500">
            Správa uživatelů, rolí a pozvánek do systému.
          </p>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm backdrop-blur">
          <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div class="flex items-center gap-2">
              <span class="text-slate-500">Celkem uživatelů:</span>
              <span class="font-semibold text-slate-900">{users.length}</span>
            </div>
          </div>
        </div>
      </div>

      <section class="mb-6 rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <div class="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-slate-950">Pozvat uživatele</h2>
            <p class="mt-1 text-sm text-slate-500">Vytvoření pozvánky do MeteoTrack systému.</p>
          </div>
        </div>
        <form
          class="flex flex-col gap-3 lg:flex-row"
          onsubmit={(event) => {
            event.preventDefault();
            invite();
          }}
        >
          <input
            bind:value={inviteEmail}
            type="email"
            placeholder="email@example.com"
            class="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-blue-400 focus:bg-white"
          />
          <button class="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            Vytvořit invite
          </button>
        </form>

        {#if createdToken}
          <div class="mt-5 rounded-3xl border border-blue-100 bg-blue-50/80 p-4">
            <p class="mb-2 text-sm font-semibold text-blue-700">Invite token</p>
            <code class="block overflow-x-auto rounded-2xl bg-white px-4 py-3 text-xs text-slate-700 shadow-sm">
              {createdToken}
            </code>
          </div>
        {/if}
      </section>

      <section class="mb-6 rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <div class="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-slate-950">Změna hesla</h2>
            <p class="mt-1 text-sm text-slate-500">
              Aktualizace hesla aktuálně přihlášeného uživatele.
            </p>
          </div>
        </div>

        <form
          class="flex flex-col gap-3 lg:flex-row"
          onsubmit={(event) => {
            event.preventDefault();
            updatePassword();
          }}
        >
          <input
            bind:value={newPassword}
            type="password"
            placeholder="Nové heslo účtu"
            class="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-blue-400 focus:bg-white"
          />
          <button
            disabled={passwordLoading || !newPassword.trim()}
            class="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {passwordLoading ? 'Ověřuji…' : 'Změnit heslo'}
          </button>
        </form>

        {#if passwordMessage}
          <div class="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {passwordMessage}
          </div>
        {/if}
      </section>

      <section class="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <div class="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-slate-950">Seznam uživatelů</h2>
            <p class="mt-1 text-sm text-slate-500">Správa rolí a přístupů v systému.</p>
          </div>
        </div>
        <div class="overflow-x-auto rounded-3xl border border-slate-100 bg-slate-50/60">
          <table class="w-full min-w-[720px] text-left text-sm">
            <thead class="border-b border-slate-200 bg-white text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-5 py-4 font-semibold">Jméno</th>
                <th class="px-5 py-4 font-semibold">Email</th>
                <th class="px-5 py-4 font-semibold">Role</th>
                <th class="px-5 py-4 text-right font-semibold">Akce</th>
              </tr>
            </thead>
            <tbody>
              {#each users as user}
                <tr class="border-t border-slate-100 bg-white transition hover:bg-slate-50/80">
                  <td class="px-5 py-4 font-semibold text-slate-900">{user.nickname}</td>
                  <td class="px-5 py-4 text-slate-600">{user.email}</td>
                  <td class="px-5 py-4">
                    <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                      {user.role}
                    </span>
                  </td>
                  <td class="px-5 py-4 text-right">
                    <div class="flex justify-end gap-2">
                      <select
                        value={user.role}
                        onchange={(event) => handleRoleChange(user.id, event)}
                        class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-400 focus:bg-white"
                      >
                        <option value="guest">guest</option>
                        <option value="operator">operator</option>
                        <option value="supervisor">supervisor</option>
                        <option value="administrator">administrator</option>
                      </select>

                      <button
                        type="button"
                        onclick={() => resetPassword(user.id)}
                        class="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-100"
                      >
                        Reset hesla
                      </button>

                      <button
                        type="button"
                        onclick={() => removeUser(user.id)}
                        class="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:border-red-200 hover:bg-red-100"
                      >
                        Odstranit
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
</div>

        {#if passwordError}
          <div class="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {passwordError}
          </div>
        {/if}