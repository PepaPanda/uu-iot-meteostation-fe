<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import type { GatewayStatus } from '../gateway-types';
	import { gatewayStatusLabel } from '../gateway-utils';

	interface Props {
		status: GatewayStatus;
	}

	let { status }: Props = $props();

	const variant = $derived(
		status === 'online' ? 'success' : status === 'offline' ? 'danger' : 'neutral'
	);
</script>

<Badge {variant} dot>{gatewayStatusLabel(status)}</Badge>
