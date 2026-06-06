<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';

	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? 'Došlo k neočekávané chybě.');
</script>

<div class="error-page">
	<p class="status">{status}</p>
	<h1>Něco se pokazilo</h1>
	<p class="message">{message}</p>
	<Button onclick={() => (window.location.href = '/dashboard')}>Zpět na přehled</Button>
</div>

<style>
	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		min-height: 100vh;
		padding: var(--space-6);
		text-align: center;
	}

	.status {
		font-size: var(--text-3xl);
		font-weight: 700;
		color: var(--color-primary);
	}

	h1 {
		font-size: var(--text-2xl);
		color: var(--color-text);
	}

	.message {
		color: var(--color-text-muted);
		max-width: 28rem;
	}
</style>
