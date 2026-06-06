<script lang="ts">
	import { ApiError } from '$lib/api/errors';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { authState } from '$lib/features/auth/auth-state.svelte';

	interface Props {
		initialToken?: string;
		onSuccess?: () => void;
	}

	let { initialToken = '', onSuccess }: Props = $props();

	let token = $state('');
	let nickname = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Prefill the token from the invite link once, while keeping it editable.
	let prefilled = false;
	$effect(() => {
		if (!prefilled && initialToken) {
			token = initialToken;
			prefilled = true;
		}
	});

	const passwordMismatch = $derived(confirmPassword.length > 0 && password !== confirmPassword);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (loading) return;

		error = null;

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
			await authState.registerFromInvite({
				token: token.trim(),
				nickname: nickname.trim(),
				password
			});
			onSuccess?.();
		} catch (err) {
			if (err instanceof ApiError && [400, 401, 404, 409, 410].includes(err.status)) {
				error = 'Pozvánka je neplatná nebo již byla použita.';
			} else {
				error = 'Registrace se nezdařila. Zkuste to prosím znovu.';
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

	<Field
		label="Token pozvánky"
		for="token"
		required
		hint="Najdete jej v pozvánce, kterou jste obdrželi."
	>
		<Input id="token" placeholder="Vložte token" bind:value={token} required />
	</Field>

	<Field label="Přezdívka" for="nickname" required>
		<Input
			id="nickname"
			autocomplete="nickname"
			placeholder="Vaše jméno"
			bind:value={nickname}
			required
		/>
	</Field>

	<Field label="Heslo" for="password" required hint="Alespoň 8 znaků.">
		<Input
			id="password"
			type="password"
			autocomplete="new-password"
			placeholder="••••••••"
			bind:value={password}
			required
		/>
	</Field>

	<Field
		label="Heslo znovu"
		for="confirm"
		required
		error={passwordMismatch ? 'Hesla se neshodují.' : undefined}
	>
		<Input
			id="confirm"
			type="password"
			autocomplete="new-password"
			placeholder="••••••••"
			invalid={passwordMismatch}
			bind:value={confirmPassword}
			required
		/>
	</Field>

	<Button type="submit" size="lg" block {loading}>Dokončit registraci</Button>
</form>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
</style>
