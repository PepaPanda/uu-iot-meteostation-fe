

<script lang="ts">
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import { registerFromInvite } from '$lib/api/register';

  let token = $state('');
  let email = $state('');
  let nickname = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');

  $effect(() => {
    const urlToken = get(page).url.searchParams.get('token');
    if (urlToken && !token) token = urlToken;
  });

  async function submit(event: SubmitEvent) {
    event.preventDefault();

    if (loading) return;

    error = '';
    loading = true;

    try {
      await registerFromInvite({
        token,
        email,
        nickname,
        password
      });

      window.location.href = '/dashboard';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Registrace se nezdařila.';
    } finally {
      loading = false;
    }
  }

  function goToLogin() {
    window.location.href = '/login';
  }
</script>

<div class="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_45%,#f1f5f9_100%)] px-4 py-8">
  <div class="w-full max-w-md rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
    <div class="mb-8 text-center">
      <div class="mb-3 text-5xl font-light text-blue-600">☁</div>
      <h1 class="text-2xl font-bold text-slate-950">Registrace</h1>
      <p class="mt-1 text-sm text-slate-500">Vytvoření účtu pomocí invite tokenu</p>
    </div>

    <form class="space-y-4" onsubmit={submit}>
      <label class="block">
        <span class="text-sm text-slate-600">Invite token</span>
        <input
          bind:value={token}
          type="text"
          autocomplete="one-time-code"
          required
          class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </label>

      <label class="block">
        <span class="text-sm text-slate-600">Email</span>
        <input
          bind:value={email}
          type="email"
          autocomplete="email"
          required
          class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </label>

      <label class="block">
        <span class="text-sm text-slate-600">Jméno</span>
        <input
          bind:value={nickname}
          type="text"
          autocomplete="name"
          required
          class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </label>

      <label class="block">
        <span class="text-sm text-slate-600">Heslo</span>
        <input
          bind:value={password}
          type="password"
          autocomplete="new-password"
          required
          class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </label>

      {#if error}
        <p class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      {/if}

      <button
        type="submit"
        disabled={loading}
        class="w-full rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Registruji…' : 'Registrovat'}
      </button>

      <div class="pt-2">
        <button
          type="button"
          onclick={goToLogin}
          class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          Zpět na přihlášení
        </button>
      </div>
    </form>
  </div>
</div>