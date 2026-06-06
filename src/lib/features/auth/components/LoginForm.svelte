<script lang="ts">
	import { ApiError } from '$lib/api/errors';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { authState } from '$lib/features/auth/auth-state.svelte';

	interface Props {
		onSuccess?: () => void;
	}

	let { onSuccess }: Props = $props();

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (loading) return;

		loading = true;
		error = null;

		try {
			await authState.login({ email, password });
			onSuccess?.();
		} catch (err) {
			if (err instanceof ApiError && [400, 401, 404].includes(err.status)) {
				error = 'Nesprávný e-mail nebo heslo.';
			} else {
				error = 'Přihlášení se nezdařilo. Zkuste to prosím znovu.';
			}
		} finally {
			loading = false;
		}
	}
</script>

<form class="form" onsubmit={handleSubmit} novalidate>
	{#if error}
		<Alert variant="danger">{error}</Alert>
	{/if}

	<Field label="E-mail" for="email" required>
		<Input
			id="email"
			type="email"
			autocomplete="username"
			placeholder="vas@email.cz"
			bind:value={email}
			required
		/>
	</Field>

	<Field label="Heslo" for="password" required>
		<Input
			id="password"
			type="password"
			autocomplete="current-password"
			placeholder="••••••••"
			bind:value={password}
			required
		/>
	</Field>

	<Button type="submit" size="lg" block {loading}>Přihlásit se</Button>
</form>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
</style>
