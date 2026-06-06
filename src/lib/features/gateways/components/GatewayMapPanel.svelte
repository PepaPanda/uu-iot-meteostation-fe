<script lang="ts">
	import 'leaflet/dist/leaflet.css';
	import type { LayerGroup, Map as LeafletMap } from 'leaflet';
	import type { Gateway, GatewayStatus } from '../gateway-types';
	import { gatewayStatusColor, gatewayStatusLabel } from '../gateway-utils';

	interface Props {
		gateways: Gateway[];
		statuses?: Record<number, GatewayStatus>;
		height?: string;
	}

	let { gateways, statuses = {}, height = '420px' }: Props = $props();

	let container = $state<HTMLDivElement | null>(null);
	let map: LeafletMap | null = null;
	let markerLayer: LayerGroup | null = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let leaflet: any = null;

	function markerIcon(color: string) {
		return leaflet.divIcon({
			className: 'gateway-marker',
			html: `<span style="--marker-color:${color}"></span>`,
			iconSize: [18, 18],
			iconAnchor: [9, 9]
		});
	}

	function renderMarkers() {
		if (!map || !markerLayer || !leaflet) return;

		markerLayer.clearLayers();
		const points: [number, number][] = [];

		for (const gateway of gateways) {
			const status = statuses[gateway.id] ?? 'unknown';
			const marker = leaflet.marker([gateway.latitude, gateway.longitude], {
				icon: markerIcon(gatewayStatusColor(status))
			});
			marker.bindPopup(
				`<strong>${gateway.name}</strong><br>${gateway.location}<br>${gatewayStatusLabel(status)}`
			);
			marker.addTo(markerLayer);
			points.push([gateway.latitude, gateway.longitude]);
		}

		if (points.length === 1) {
			map.setView(points[0], 13);
		} else if (points.length > 1) {
			map.fitBounds(points, { padding: [40, 40], maxZoom: 13 });
		}
	}

	$effect(() => {
		// Re-run when data changes once the map is ready.
		void gateways;
		void statuses;
		renderMarkers();
	});

	$effect(() => {
		if (!container) return;

		let disposed = false;

		(async () => {
			const mod = await import('leaflet');
			if (disposed || !container) return;
			leaflet = mod.default;

			map = leaflet.map(container, { scrollWheelZoom: false }).setView([49.8, 15.5], 7);
			leaflet
				.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution: '© OpenStreetMap',
					maxZoom: 19
				})
				.addTo(map);
			markerLayer = leaflet.layerGroup().addTo(map);
			renderMarkers();
		})();

		return () => {
			disposed = true;
			map?.remove();
			map = null;
			markerLayer = null;
		};
	});
</script>

<div class="map" bind:this={container} style={`height: ${height}`}></div>

<style>
	.map {
		width: 100%;
		border-radius: var(--radius-lg);
		overflow: hidden;
		z-index: 0;
	}

	:global(.gateway-marker span) {
		display: block;
		width: 18px;
		height: 18px;
		border-radius: var(--radius-full);
		background-color: var(--marker-color);
		border: 3px solid #fff;
		box-shadow: 0 1px 4px rgb(15 23 42 / 0.4);
	}
</style>
