<script lang="ts">
	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { changePassword } from '../users-api';

	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	const mismatch = $derived(confirmPassword.length > 0 && password !== confirmPassword);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (loading) return;

		error = null;
		success = false;

		if (password.length < 8) {
			error = 'Heslo musí mít alespoň 8 znaků.';
			return;
		}
		if (password !== confirmPassword) {
			error = 'Hesla se neshodují.';
			return;
		}

		loading = true;
		try {
			await changePassword(password);
			success = true;
			password = '';
			confirmPassword = '';
		} catch {
			error = 'Heslo se nepodařilo změnit.';
		} finally {
			loading = false;
		}
	}
</script>

<form class="form" onsubmit={handleSubmit} novalidate>
	{#if error}
		<Alert variant="danger">{error}</Alert>
	{:else if success}
		<Alert variant="success">Heslo bylo úspěšně změněno.</Alert>
	{/if}

	<Field label="Nové heslo" for="new-password" required hint="Alespoň 8 znaků.">
		<Input
			id="new-password"
			type="password"
			autocomplete="new-password"
			bind:value={password}
			required
		/>
	</Field>

	<Field
		label="Nové heslo znovu"
		for="confirm-password"
		required
		error={mismatch ? 'Hesla se neshodují.' : undefined}
	>
		<Input
			id="confirm-password"
			type="password"
			autocomplete="new-password"
			invalid={mismatch}
			bind:value={confirmPassword}
			required
		/>
	</Field>

	<div class="actions">
		<Button type="submit" {loading}>Změnit heslo</Button>
	</div>
</form>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.actions {
		display: flex;
		justify-content: flex-start;
	}
</style>
