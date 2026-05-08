<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { createGateway, getGatewayHealth, listGateways } from '$lib/api/gateways';
  import type { Gateway } from '$lib/types';

  let gateways = $state<Gateway[]>([]);
  let search = $state('');
  let loading = $state(true);
  let sidebarCollapsed = $state(false);
  let createModalOpen = $state(false);
  let creatingGateway = $state(false);
  let createdSecret = $state('');

  let gatewayName = $state('');
  let gatewayDescription = $state('');
  let gatewayLocation = $state('');
  let gatewayLatitude = $state('');
  let gatewayLongitude = $state('');
  async function submitGateway() {
    if (!gatewayName.trim() || creatingGateway) return;

    creatingGateway = true;

    try {
      const result = await createGateway({
        name: gatewayName,
        description: gatewayDescription || undefined,
        location: gatewayLocation || undefined,
        latitude: gatewayLatitude ? Number(gatewayLatitude) : undefined,
        longitude: gatewayLongitude ? Number(gatewayLongitude) : undefined
      });

      createdSecret = result.secret ?? result.gatewayToken ?? '';

      gatewayName = '';
      gatewayDescription = '';
      gatewayLocation = '';
      gatewayLatitude = '';
      gatewayLongitude = '';

      await loadGateways();
    } finally {
      creatingGateway = false;
    }
  }

  let filtered = $derived(
    gateways.filter((g) =>
      `${g.name} ${g.location}`.toLowerCase().includes(search.toLowerCase())
    )
  );

  function normalizeStatus(status: string | undefined | null): Gateway['status'] {
    if (status === 'online' || status === 'offline' || status === 'unknown') return status;
    return 'unknown';
  }

  function formatDateTime(value: string | null | undefined): string {
    if (!value) return '-';

    return new Date(value).toLocaleString('cs-CZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  async function loadGateways() {
    loading = true;

    const result = await listGateways();

    gateways = await Promise.all(
      result.items.map(async (gateway) => {
        const health = await getGatewayHealth(gateway.id).catch(() => null);

        return {
          ...gateway,
          status: normalizeStatus(health?.status ?? gateway.status),
          lastTelemetryReceivedAt: health?.lastTelemetryAtUtc ?? gateway.lastTelemetryReceivedAt ?? null
        };
      })
    );

    loading = false;
  }

  onMount(() => {
    sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

    const handleSidebarChange = (event: Event) => {
      sidebarCollapsed = (event as CustomEvent<boolean>).detail === true;
    };

    window.addEventListener('sidebar-collapsed-change', handleSidebarChange);
    loadGateways();

    return () => {
      window.removeEventListener('sidebar-collapsed-change', handleSidebarChange);
    };
  });
</script>

<div class="min-h-screen bg-slate-100">
  <Sidebar />
  <main class={`transition-[padding] duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
    <div class="mx-auto max-w-[1600px] px-4 pb-24 pt-6 sm:px-8 lg:px-10 lg:pb-6 xl:px-12">
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="text-3xl font-bold">Gatewaye</h1>
          <p class="text-slate-500">Seznam všech meteo stanic</p>
        </div>
        <button
          type="button"
          onclick={() => {
            createModalOpen = true;
            createdSecret = '';
          }}
          class="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Přidat gateway
        </button>
      </div>

      <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">Přehled gatewayí</h2>
            <p class="text-sm text-slate-500">Monitorování dostupnosti a posledních přenosů</p>
          </div>

          <div class="w-full lg:w-auto">
            <input
              bind:value={search}
              placeholder="Hledat gateway…"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white lg:w-80"
            />
          </div>
        </div>

        {#if loading}
          <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
            Načítám gatewaye…
          </div>
        {:else}
          <div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {#each filtered as gateway}
              <article class="rounded-3xl border border-slate-100 bg-slate-50/70 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
                <div class="mb-5 flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h3 class="truncate text-lg font-semibold text-slate-900">
                      {gateway.name}
                    </h3>

                    <p class="mt-1 truncate text-sm text-slate-500">
                      {gateway.location || 'Neznámá lokace'}
                    </p>
                  </div>

                  <StatusBadge status={gateway.status} />
                </div>

                <div class="mb-5 rounded-2xl border border-slate-100 bg-white p-4">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-slate-500">Poslední přenos</span>
                    <span class="font-semibold text-slate-900">
                      {formatDateTime(gateway.lastTelemetryReceivedAt)}
                    </span>
                  </div>
                </div>

                <div class="flex items-center justify-between gap-3 text-sm">
                  <div class="text-slate-500">
                    ID:
                    <span class="font-semibold text-slate-900">{gateway.id}</span>
                  </div>

                  <a
                    class="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                    href={`/gateways/${gateway.id}`}
                  >
                    Detail
                  </a>
                </div>
              </article>
            {:else}
              <div class="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500 md:col-span-2 2xl:col-span-3">
                Nebyly nalezeny žádné gatewaye.
              </div>
            {/each}
          </div>
        {/if}
      </section>
    </div>
  </main>
</div>

{#if createModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
    <div class="w-full max-w-2xl rounded-[2rem] border border-white/60 bg-white p-6 shadow-2xl">
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-950">Nová gateway</h2>
          <p class="mt-1 text-sm text-slate-500">
            Vytvoření nové meteostanice.
          </p>
        </div>

        <button
          type="button"
          onclick={() => {
            createModalOpen = false;
          }}
          class="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Zavřít
        </button>
      </div>

      <form
        class="grid gap-4 md:grid-cols-2"
        onsubmit={(event) => {
          event.preventDefault();
          submitGateway();
        }}
      >
        <div class="md:col-span-2">
          <label class="mb-2 block text-sm font-medium text-slate-700">Název</label>
          <input
            bind:value={gatewayName}
            required
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
            placeholder="Praha střecha"
          />
        </div>

        <div class="md:col-span-2">
          <label class="mb-2 block text-sm font-medium text-slate-700">Popis</label>
          <textarea
            bind:value={gatewayDescription}
            rows="3"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
            placeholder="Gateway umístěná na střeše budovy"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">Lokace</label>
          <input
            bind:value={gatewayLocation}
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
            placeholder="Praha"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">Latitude</label>
          <input
            bind:value={gatewayLatitude}
            type="number"
            step="0.000001"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
            placeholder="50.0755"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">Longitude</label>
          <input
            bind:value={gatewayLongitude}
            type="number"
            step="0.000001"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
            placeholder="14.4378"
          />
        </div>

        <div class="md:col-span-2 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onclick={() => {
              createModalOpen = false;
            }}
            class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Zrušit
          </button>

          <button
            type="submit"
            disabled={creatingGateway || !gatewayName.trim()}
            class="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingGateway ? 'Vytvářím…' : 'Vytvořit gateway'}
          </button>
        </div>
      </form>

      {#if createdSecret}
        <div class="mt-6 rounded-3xl border border-amber-100 bg-amber-50 p-5">
          <p class="mb-2 text-sm font-semibold text-amber-700">
            Gateway secret (zobrazí se pouze jednou)
          </p>

          <code class="block overflow-x-auto rounded-2xl bg-white px-4 py-3 text-xs text-slate-700 shadow-sm">
            {createdSecret}
          </code>
        </div>
      {/if}
    </div>
  </div>
{/if}
