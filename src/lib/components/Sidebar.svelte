<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { logout, me } from '$lib/api/auth';
  import { auth } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { browser } from '$app/environment';

  let collapsed = $state(browser && localStorage.getItem('sidebarCollapsed') === 'true');

  $effect(() => {

    if (!browser) return;

    localStorage.setItem('sidebarCollapsed', String(collapsed));

    window.dispatchEvent(new CustomEvent('sidebar-collapsed-change', { detail: collapsed }));

  });

  const items = [
    { href: '/dashboard', label: 'Přehled', icon: '⌂' },
    { href: '/gateways', label: 'Gatewaye', icon: '▦' },
    { href: '/notifications', label: 'Notifikace', icon: '!' },
    { href: '/users', label: 'Uživatelé', icon: '♙' }
  ];

  function userInitials(name: string | null | undefined): string {
    const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return 'U';
  }

  onMount(() => {
    if (!get(auth).user) {
      me().catch(() => {
      });
    }

  });
  async function handleLogout() {
    await logout();
    goto('/login');
  }
</script>

<aside class={`fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur transition-[width] duration-300 lg:block ${collapsed ? 'w-20' : 'w-64'}`}>
  <div class="relative mb-8 flex h-12 items-center">
    <a href="/dashboard" class={`flex min-w-0 items-center rounded-2xl px-2 py-2 font-bold text-slate-950 ${collapsed ? 'justify-center' : 'gap-3'}`}>
      <span class="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-sm">☁</span>
      {#if !collapsed}
        <span class="truncate">MeteoTrack</span>
      {/if}
    </a>

    <button
            type="button"
            onclick={() => {
            collapsed = !collapsed;
            }}
            aria-label={collapsed ? 'Rozbalit menu' : 'Sbalit menu'}
            class="absolute -right-8 top-12 z-50 grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
    >
      {collapsed ? '›' : '‹'}
    </button>
  </div>

  <nav class="space-y-1.5">
    {#each items as item}
      <a
              href={item.href}
              class={`flex items-center rounded-2xl px-3 py-2.5 text-sm font-medium transition ${collapsed ? 'justify-center gap-0' : 'gap-3'} ${
          $page.url.pathname.startsWith(item.href)
            ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
        }`}
      >
        <span class="grid h-7 w-7 place-items-center rounded-xl bg-white/70 text-sm shadow-sm ring-1 ring-slate-100">{item.icon}</span>
        {#if !collapsed}
          <span class="truncate">{item.label}</span>
        {/if}
      </a>
    {/each}
  </nav>
  <div class="absolute bottom-4 left-4 right-4 space-y-3">
    <div class={`${collapsed ? 'border-0 bg-transparent p-0 shadow-none' : 'rounded-3xl border border-slate-200 bg-slate-50 p-3'}`}>
      <div class={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-200 text-sm font-semibold text-slate-700">
          {userInitials($auth.user?.nickname)}
        </div>
        {#if !collapsed}
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-slate-900">
              {$auth.user?.nickname ?? 'Uživatel'}
            </p>
            <p class="truncate text-xs text-slate-500">
              {$auth.user?.email ?? 'Nepřihlášen'}
            </p>
          </div>
        {/if}
      </div>
    </div>

    <button
      onclick={handleLogout}
      aria-label="Odhlásit se"
      class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
    >
      {collapsed ? '↩' : 'Odhlásit se'}
    </button>
  </div>
</aside>

<nav class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur lg:hidden">
  <div class="mx-auto grid max-w-md grid-cols-6 gap-1">
    {#each items as item}
      <a
              href={item.href}
              aria-label={item.label}
              class={`grid place-items-center rounded-2xl px-2 py-2 text-lg transition ${
          $page.url.pathname.startsWith(item.href)
            ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
        }`}
      >
        <span>{item.icon}</span>
      </a>
    {/each}
    <button
      type="button"
      onclick={handleLogout}
      aria-label="Odhlásit se"
      class="grid place-items-center rounded-2xl px-2 py-2 text-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
    >
      ↩
    </button>
  </div>
</nav>