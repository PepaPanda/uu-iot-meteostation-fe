<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { acknowledgeNotification, listNotifications } from '$lib/api/notifications';
  import type { NotificationItem } from '$lib/types';

  let items = $state<NotificationItem[]>([]);
  let filter = $state('all');
  let sidebarCollapsed = $state(false);

  let filtered = $derived(
    items.filter((item) => filter === 'all' || item.type === filter)
  );

  async function load() {
    items = (await listNotifications()).items;
  }

  async function ack(id: string) {
    await acknowledgeNotification(id);
    await load();
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
            MeteoTrack Center
          </p>
          <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Notifikace
          </h1>
          <p class="mt-2 text-sm text-slate-500">
            Přehled systémových upozornění, stavů gatewayí a důležitých událostí.
          </p>
        </div>

        <div class="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur">
          {#each ['all', 'info', 'warning', 'danger'] as option}
            <button
              onclick={() => (filter = option)}
              class={`rounded-2xl px-4 py-2 text-sm font-medium transition-all ${filter === option
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {option}
            </button>
          {/each}
        </div>
      </div>

      <section class="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-slate-950">
              Centrum notifikací
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              Aktivní upozornění a systémové události.
            </p>
          </div>

          <div class="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            {filtered.length} položek
          </div>
        </div>

        <div class="space-y-4">
          {#each filtered as item}
            <div class="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 transition-all hover:border-blue-200 hover:bg-white hover:shadow-md">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex min-w-0 items-start gap-4">
                  <div
                    class={`mt-1 h-3 w-3 shrink-0 rounded-full ${item.type === 'danger'
                      ? 'bg-red-500'
                      : item.type === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-blue-500'}`}
                  ></div>

                  <div class="min-w-0">
                    <div class="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        class={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${item.type === 'danger'
                          ? 'bg-red-100 text-red-700'
                          : item.type === 'warning'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'}`}
                      >
                        {item.type}
                      </span>

                      <span class="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                        gateway {item.gatewayId ?? 'system'}
                      </span>
                    </div>

                    <p class="text-base font-semibold text-slate-900">
                      {item.text}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  {#if !item.acknowledged}
                    <button
                      onclick={() => ack(item.id)}
                      class="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Potvrdit
                    </button>
                  {:else}
                    <span class="rounded-2xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                      Potvrzeno
                    </span>
                  {/if}
                </div>
              </div>
            </div>
          {:else}
            <div class="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center">
              <p class="text-base font-semibold text-slate-700">
                Žádné notifikace
              </p>
              <p class="mt-2 text-sm text-slate-500">
                Aktuálně nejsou dostupná žádná upozornění.
              </p>
            </div>
          {/each}
        </div>
      </section>
    </div>
  </main>
</div>
