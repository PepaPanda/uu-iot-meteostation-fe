<script lang="ts">
  import { login } from '$lib/api/auth';
  import { goto } from '$app/navigation';

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  async function doLogin() {
    if (loading) return;

    loading = true;
    error = '';

    try {
      await login(email, password);
      await goto('/dashboard');
    } catch (e) {
      error = e instanceof Error ? e.message : 'Přihlášení selhalo';
    } finally {
      loading = false;
    }
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    await doLogin();
  }

  async function submitOnEnter(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    await doLogin();
  }

  async function goToRegister() {
    await goto('/register');
  }
</script>

<div class="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_45%,#f1f5f9_100%)] px-4">
  <div class="w-full max-w-md rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
    <div class="mb-8 text-center">
      <div class="mb-3 text-5xl font-light text-blue-600">☁</div>
      <h1 class="text-2xl font-bold text-slate-950">MeteoTrack</h1>
      <p class="mt-1 text-sm text-slate-500">Přihlášení do systému</p>
    </div>

    <form class="space-y-4" onsubmit={submit}>
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
        <span class="text-sm text-slate-600">Heslo</span>
        <input
                bind:value={password}
                type="password"
                autocomplete="current-password"
                onkeydown={submitOnEnter}
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
        {loading ? 'Přihlašuji…' : 'Přihlásit se'}
      </button>

      <div class="pt-2">
        <button
          type="button"
          onclick={goToRegister}
          class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          Registrace pomocí tokenu
        </button>
      </div>
    </form>
  </div>
</div>
