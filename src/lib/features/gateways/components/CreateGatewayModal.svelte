<script lang="ts">
	import { ApiError } from '$lib/api/errors';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import { createGateway } from '../gateways-api';
	import type { Gateway } from '../gateway-types';

	interface Props {
		open?: boolean;
		onCreated?: (gateway: Gateway) => void;
	}

	let { open = $bindable(false), onCreated }: Props = $props();

	let name = $state('');
	let description = $state('');
	let location = $state('');
	let latitude = $state('');
	let longitude = $state('');

	let loading = $state(false);
	let error = $state<string | null>(null);
	let secret = $state<string | null>(null);
	let copied = $state(false);

	function reset() {
		name = '';
		description = '';
		location = '';
		latitude = '';
		longitude = '';
		error = null;
		secret = null;
		copied = false;
		loading = false;
	}

	function handleClose() {
		open = false;
		reset();
	}

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
			const result = await createGateway({
				name: name.trim(),
				description: description.trim(),
				location: location.trim(),
				latitude: lat,
				longitude: lng
			});
			secret = result.secret;
			onCreated?.(result.gateway);
		} catch (err) {
			if (err instanceof ApiError && err.isForbidden) {
				error = 'Nemáte oprávnění vytvořit gateway.';
			} else {
				error = 'Gateway se nepodařilo vytvořit. Zkontrolujte zadané údaje.';
			}
		} finally {
			loading = false;
		}
	}

	async function copySecret() {
		if (!secret) return;
		try {
			await navigator.clipboard.writeText(secret);
			copied = true;
		} catch {
			copied = false;
		}
	}
</script>

<Modal bind:open title={secret ? 'Gateway vytvořen' : 'Nový gateway'} onClose={handleClose}>
	{#if secret}
		<div class="secret-view">
			<Alert variant="warning" title="Uložte si tajný klíč">
				Tento klíč slouží k autentizaci zařízení a zobrazí se pouze nyní. Po zavření jej již nebude
				možné zobrazit.
			</Alert>
			<div class="secret-box">
				<code>{secret}</code>
				<Button variant="secondary" size="sm" onclick={copySecret}>
					{copied ? 'Zkopírováno' : 'Kopírovat'}
				</Button>
			</div>
		</div>
	{:else}
		<form class="form" id="create-gateway-form" onsubmit={handleSubmit} novalidate>
			{#if error}
				<Alert variant="danger">{error}</Alert>
			{/if}

			<Field label="Název" for="gw-name" required>
				<Input id="gw-name" bind:value={name} maxlength={255} required />
			</Field>

			<Field label="Popis" for="gw-description" required>
				<Textarea id="gw-description" bind:value={description} maxlength={2000} required />
			</Field>

			<Field label="Umístění" for="gw-location" required>
				<Input
					id="gw-location"
					placeholder="Např. Praha, střecha budovy A"
					bind:value={location}
					required
				/>
			</Field>

			<div class="coords">
				<Field label="Zeměpisná šířka" for="gw-lat" required>
					<Input
						id="gw-lat"
						type="number"
						step="any"
						placeholder="50.08"
						bind:value={latitude}
						required
					/>
				</Field>
				<Field label="Zeměpisná délka" for="gw-lng" required>
					<Input
						id="gw-lng"
						type="number"
						step="any"
						placeholder="14.42"
						bind:value={longitude}
						required
					/>
				</Field>
			</div>
		</form>
	{/if}

	{#snippet footer()}
		{#if secret}
			<Button onclick={handleClose}>Hotovo</Button>
		{:else}
			<Button variant="secondary" onclick={handleClose}>Zrušit</Button>
			<Button type="submit" form="create-gateway-form" {loading}>Vytvořit</Button>
		{/if}
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

	.secret-view {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.secret-box {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background-color: var(--color-surface-muted);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.secret-box code {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		word-break: break-all;
		color: var(--color-text);
	}

	@media (max-width: 480px) {
		.coords {
			grid-template-columns: 1fr;
		}
	}
</style>
