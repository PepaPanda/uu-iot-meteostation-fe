<script lang="ts">
  import { onMount } from 'svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import type { Gateway } from '$lib/types';

  type Props = {
    gateways?: Gateway[];
    onlineGatewaysCount?: number;
    offlineGatewaysCount?: number;
    formatTime: (value: string | null | undefined) => string;
  };

  let {
    gateways = [],
    onlineGatewaysCount = 0,
    offlineGatewaysCount = 0,
    formatTime
  }: Props = $props();

  let mapElement = $state<HTMLDivElement | null>(null);
  let mapReady = $state(false);
  let map: any = null;
  let markersLayer: any = null;

  const gatewayCoordinates = $derived(
          gateways
                  .map((gateway) => ({
                    ...gateway,
                    latitudeNumber: Number(gateway.latitude),
                    longitudeNumber: Number(gateway.longitude)
                  }))
                  .filter((gateway) => Number.isFinite(gateway.latitudeNumber) && Number.isFinite(gateway.longitudeNumber))
  );

  function statusColor(status: Gateway['status']): string {
    if (status === 'online') return '#10b981';
    if (status === 'offline') return '#ef4444';
    return '#64748b';
  }

  function ensureLeafletAssets(): Promise<any> {
    const existingLeaflet = (window as Window & { L?: any }).L;
    if (existingLeaflet) return Promise.resolve(existingLeaflet);

    if (!document.querySelector('link[data-leaflet-css="true"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.dataset.leafletCss = 'true';
      document.head.appendChild(link);
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[data-leaflet-js="true"]');

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve((window as Window & { L?: any }).L));
        existingScript.addEventListener('error', reject);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.dataset.leafletJs = 'true';
      script.onload = () => resolve((window as Window & { L?: any }).L);
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function renderMap() {
    if (!mapReady || !mapElement) return;

    const L = (window as Window & { L?: any }).L;
    if (!L) return;

    if (!map) {
      map = L.map(mapElement, {
        scrollWheelZoom: false,
        zoomControl: true
      }).setView([49.8, 15.5], 7);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      markersLayer = L.layerGroup().addTo(map);
    }

    markersLayer.clearLayers();

    if (gatewayCoordinates.length === 0) {
      map.setView([49.8, 15.5], 7);
      return;
    }

    const bounds = L.latLngBounds([]);

    for (const gateway of gatewayCoordinates) {
      const markerColor = statusColor(gateway.status);
      const marker = L.marker([gateway.latitudeNumber, gateway.longitudeNumber], {
        icon: L.divIcon({
          className: 'gateway-map-marker',
          html: `<span style="background:${markerColor}"></span>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        })
      });

      marker.bindPopup(`
        <strong>${gateway.name}</strong><br />
        ${gateway.location || 'Neznámá lokace'}<br />
        Stav: ${gateway.status}<br />
        Poslední přenos: ${formatTime(gateway.lastTelemetryReceivedAt)}
      `);

      marker.addTo(markersLayer);
      bounds.extend([gateway.latitudeNumber, gateway.longitudeNumber]);
    }

    if (gatewayCoordinates.length === 1) {
      map.setView([gatewayCoordinates[0].latitudeNumber, gatewayCoordinates[0].longitudeNumber], 12);
    } else {
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 13 });
    }

    setTimeout(() => map?.invalidateSize(), 0);
  }

  onMount(() => {
    let destroyed = false;

    ensureLeafletAssets()
      .then(() => {
        if (destroyed) return;
        mapReady = true;
        renderMap();
      })
      .catch(() => {
        if (destroyed) return;
        mapReady = false;
      });

    return () => {
      destroyed = true;
      map?.remove();
      map = null;
      markersLayer = null;
    };
  });

  $effect(() => {
    gateways;
    mapReady;
    renderMap();
  });
</script>

<section class="mt-8 rounded-4xl border border-white/60 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
  <div class="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
    <div>
      <h2 class="text-base font-semibold">Přehled meteostanic</h2>
      <p class="text-sm text-slate-500">Online: {onlineGatewaysCount} · Offline: {offlineGatewaysCount}</p>
    </div>
    <a href="/gateways" class="primary-link">Zobrazit všechny stanice →</a>
  </div>

  <div class="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-slate-50/70 p-3 shadow-sm">
    <div class="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
      <div>
        <h3 class="text-sm font-semibold text-slate-900">Mapa meteostanic</h3>
        <p class="text-xs text-slate-500">Mapa zobrazuje meteostanice s nastavenou polohou.</p>
      </div>

      <div class="flex flex-wrap gap-2 text-xs text-slate-500">
        <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Online stanice</span>
        <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-red-500"></span> Offline stanice</span>
        <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-slate-500"></span> Neznámý stav stanice</span>
      </div>
    </div>

    {#if gatewayCoordinates.length > 0}
      <div bind:this={mapElement} class="h-[360px] w-full rounded-2xl border border-slate-200 bg-slate-100"></div>
    {:else}
      <div class="grid h-[260px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-white text-center text-sm text-slate-500">
        Žádná meteostanice zatím nemá nastavené souřadnice.
      </div>
    {/if}
  </div>

  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {#each gateways.slice(0, 6) as gateway}
      <article class="rounded-3xl border border-slate-100 bg-slate-50/70 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-base font-semibold text-slate-950">{gateway.name}</p>
            <p class="mt-1 truncate text-sm text-slate-500">{gateway.location || 'Neznámá lokace'}</p>
          </div>

          <StatusBadge status={gateway.status} />
        </div>

        <div class="mb-5 rounded-2xl border border-slate-100 bg-white p-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-500">Poslední odeslaná data</span>
            <span class="font-semibold text-slate-900">{formatTime(gateway.lastTelemetryReceivedAt)}</span>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <div class="text-xs text-slate-500">
            ID: <span class="font-medium text-slate-700">{gateway.id}</span>
          </div>

          <a
                  class="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  href={`/gateways/${gateway.id}`}
          >
            Detail stanice
          </a>
        </div>
      </article>
    {:else}
      <div class="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
        Zatím nejsou dostupné žádné stanice.
      </div>
    {/each}
  </div>
</section>

<style>
  :global(.gateway-map-marker) {
    background: transparent;
    border: 0;
  }

  :global(.gateway-map-marker span) {
    display: block;
    width: 18px;
    height: 18px;
    border: 3px solid white;
    border-radius: 9999px;
    box-shadow: 0 8px 18px rgb(15 23 42 / 0.25);
  }
</style>