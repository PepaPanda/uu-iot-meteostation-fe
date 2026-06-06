<script lang="ts">
	import { ApiError } from '$lib/api/errors';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { inviteUser } from '../users-api';

	interface Props {
		onInvited?: () => void;
	}

	let { onInvited }: Props = $props();

	let email = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let token = $state<string | null>(null);
	let copied = $state(false);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (loading) return;

		loading = true;
		error = null;
		try {
			const result = await inviteUser(email.trim());
			token = result.invitationPlainToken;
			onInvited?.();
		} catch (err) {
			if (err instanceof ApiError && err.status === 409) {
				error = 'Uživatel s tímto e-mailem již existuje.';
			} else if (err instanceof ApiError && err.isForbidden) {
				error = 'Nemáte oprávnění zvát uživatele.';
			} else {
				error = 'Pozvánku se nepodařilo vytvořit.';
			}
		} finally {
			loading = false;
		}
	}

	async function copyToken() {
		if (!token) return;
		try {
			await navigator.clipboard.writeText(token);
			copied = true;
		} catch {
			copied = false;
		}
	}
</script>

{#if token}
	<div class="result">
		<Alert variant="success" title="Pozvánka vytvořena">
			Předejte tento token uživateli <strong>{email}</strong>. Použije jej k registraci.
		</Alert>
		<div class="token-box">
			<code>{token}</code>
			<Button variant="secondary" size="sm" onclick={copyToken}>
				{copied ? 'Zkopírováno' : 'Kopírovat'}
			</Button>
		</div>
	</div>
{:else}
	<form class="form" onsubmit={handleSubmit} novalidate>
		{#if error}
			<Alert variant="danger">{error}</Alert>
		{/if}
		<Field label="E-mail uživatele" for="invite-email" required>
			<Input
				id="invite-email"
				type="email"
				placeholder="novy@email.cz"
				bind:value={email}
				required
			/>
		</Field>
		<Button type="submit" block {loading}>Vytvořit pozvánku</Button>
	</form>
{/if}

<style>
	.form,
	.result {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.token-box {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background-color: var(--color-surface-muted);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.token-box code {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		word-break: break-all;
		color: var(--color-text);
	}
</style>
