import { telemetryStreamUrl } from './telemetry-api';
import type { Telemetry } from './telemetry-types';

/**
 * Subscribes to the live telemetry SSE stream for a gateway. Calls `onTelemetry`
 * for every `telemetry` event. Returns a cleanup function that closes the stream.
 */
export function subscribeTelemetry(
	gatewayId: number,
	onTelemetry: (telemetry: Telemetry) => void
): () => void {
	const source = new EventSource(telemetryStreamUrl(gatewayId), { withCredentials: true });

	source.addEventListener('telemetry', (event) => {
		try {
			onTelemetry(JSON.parse((event as MessageEvent).data) as Telemetry);
		} catch {
			// Ignore malformed payloads.
		}
	});

	return () => source.close();
}
