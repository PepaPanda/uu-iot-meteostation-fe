<script lang="ts">
	import { ApiError } from '$lib/api/errors';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import { updateGateway } from '../gateways-api';
	import type { Gateway } from '../gateway-types';

	interface Props {
		open?: boolean;
		gateway: Gateway;
		onUpdated?: (gateway: Gateway) => void;
	}

	let { open = $bindable(false), gateway, onUpdated }: Props = $props();

	let name = $state('');
	let description = $state('');
	let location = $state('');
	let latitude = $state('');
	let longitude = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Reset the form to the current gateway each time the modal opens.
	let wasOpen = false;
	$effect(() => {
		if (open && !wasOpen) {
			name = gateway.name;
			description = gateway.description;
			location = gateway.location;
			latitude = String(gateway.latitude);
			longitude = String(gateway.longitude);
			error = null;
		}
		wasOpen = open;
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (loading) return;

		error = null;
		const lat = Number(latitude);
		const lng = Number(longitude);

		if (!name.trim() || !description.trim() || !location.trim()) {
			error = 'Vyplňte prosím všechna pole.';
			return;
		}
		if (Number.isNaN(lat) || lat < -90 || lat > 90) {
			error = 'Zeměpisná šířka musí být číslo mezi -90 a 90.';
			return;
		}
		if (Number.isNaN(lng) || lng < -180 || lng > 180) {
			error = 'Zeměpisná délka musí být číslo mezi -180 a 180.';
			return;
		}

		loading = true;
		try {
			const updated = await updateGateway(gateway.id, {
				name: name.trim(),
				description: description.trim(),
				location: location.trim(),
				latitude: lat,
				longitude: lng
			});
			onUpdated?.(updated);
			open = false;
		} catch (err) {
			error =
				err instanceof ApiError && err.isForbidden
					? 'Nemáte oprávnění upravit gateway.'
					: 'Změny se nepodařilo uložit.';
		} finally {
			loading = false;
		}
	}
</script>

<Modal bind:open title="Upravit gateway">
	<form class="form" id="edit-gateway-form" onsubmit={handleSubmit} novalidate>
		{#if error}
			<Alert variant="danger">{error}</Alert>
		{/if}

		<Field label="Název" for="edit-name" required>
			<Input id="edit-name" bind:value={name} maxlength={255} required />
		</Field>

		<Field label="Popis" for="edit-description" required>
			<Textarea id="edit-description" bind:value={description} maxlength={2000} required />
		</Field>

		<Field label="Umístění" for="edit-location" required>
			<Input id="edit-location" bind:value={location} required />
		</Field>

		<div class="coords">
			<Field label="Zeměpisná šířka" for="edit-lat" required>
				<Input id="edit-lat" type="number" step="any" bind:value={latitude} required />
			</Field>
			<Field label="Zeměpisná délka" for="edit-lng" required>
				<Input id="edit-lng" type="number" step="any" bind:value={longitude} required />
			</Field>
		</div>
	</form>

	{#snippet footer()}
		<Button variant="secondary" onclick={() => (open = false)}>Zrušit</Button>
		<Button type="submit" form="edit-gateway-form" {loading}>Uložit</Button>
	{/snippet}
</Modal>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.coords {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
	}

	@media (max-width: 480px) {
		.coords {
			grid-template-columns: 1fr;
		}
	}
</style>
