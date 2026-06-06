<script lang="ts">
	import { goto } from '$app/navigation';
	import LoginForm from '$lib/features/auth/components/LoginForm.svelte';
</script>

<svelte:head>
	<title>Přihlášení · MeteoTrack</title>
</svelte:head>

<div class="head">
	<h1>Přihlášení</h1>
	<p>Zadejte své přihlašovací údaje pro vstup do aplikace.</p>
</div>

<LoginForm onSuccess={() => goto('/dashboard')} />

<p class="foot">
	Máte pozvánku? <a href="/register">Dokončit registraci</a>
</p>

<style>
	.head {
		margin-bottom: var(--space-6);
	}

	.head h1 {
		font-size: var(--text-2xl);
		color: var(--color-text);
		margin-bottom: 0.25rem;
	}

	.head p {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.foot {
		margin-top: var(--space-6);
		text-align: center;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}
</style>
