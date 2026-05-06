<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import { acknowledgeNotification, listNotifications } from '$lib/api/notifications';
  import type { NotificationItem } from '$lib/types';

  let items = $state<NotificationItem[]>([]);
  let filter = $state('all');

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

  onMount(load);
</script>

<div class="min-h-screen bg-slate-100">
  <Sidebar />

  <main class="lg:pl-64">
    <div class="mx-auto max-w-7xl px-4 py-6">
      <h1 class="mb-6 text-3xl font-bold">Notifikace</h1>

      <div class="rounded-2xl border bg-white p-5 shadow-sm">
        <div class="mb-4 flex gap-2">
          {#each ['all', 'info', 'warning', 'danger'] as option}
            <button
              on:click={() => (filter = option)}
              class={`rounded-xl px-3 py-1 text-sm ${filter === option ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}
            >
              {option}
            </button>
          {/each}
        </div>

        <div class="space-y-3">
          {#each filtered as item}
            <div class="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p class="font-medium">{item.text}</p>
                <p class="text-sm text-slate-500">{item.type} · gateway {item.gatewayId ?? 'system'}</p>
              </div>

              {#if !item.acknowledged}
                <button on:click={() => ack(item.id)} class="rounded-xl border px-3 py-2 text-sm">Potvrdit</button>
              {:else}
                <span class="text-sm text-emerald-600">Potvrzeno</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </main>
</div>
