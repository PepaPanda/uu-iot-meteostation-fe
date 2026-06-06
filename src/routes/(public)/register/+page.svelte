<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import RegisterForm from '$lib/features/auth/components/RegisterForm.svelte';

	const initialToken = $derived(page.url.searchParams.get('token') ?? '');
</script>

<svelte:head>
	<title>Registrace · MeteoTrack</title>
</svelte:head>

<div class="head">
	<h1>Dokončení registrace</h1>
	<p>Aktivujte svůj účet pomocí tokenu z pozvánky.</p>
</div>

<RegisterForm {initialToken} onSuccess={() => goto('/dashboard')} />

<p class="foot">
	Už máte účet? <a href="/login">Přihlásit se</a>
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
