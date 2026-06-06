<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Snippet } from 'svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { authState } from '$lib/features/auth/auth-state.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	$effect(() => {
		if (authState.isResolved && authState.isAuthenticated) {
			void goto('/dashboard');
		}
	});
</script>

{#if !authState.isResolved}
	<div class="center"><Spinner size="lg" /></div>
{:else if !authState.isAuthenticated}
	<div class="auth-shell">
		<div class="auth-card">
			<div class="brand">
				<span class="logo"><Icon name="thermometer" size={24} /></span>
				<span class="brand-name">MeteoTrack</span>
			</div>
			{@render children()}
		</div>
	</div>
{/if}

<style>
	.center {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
	}

	.auth-shell {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: var(--space-4);
		background:
			radial-gradient(circle at 20% 20%, rgb(37 99 235 / 0.08), transparent 40%), var(--color-bg);
	}

	.auth-card {
		width: 100%;
		max-width: 26rem;
		padding: var(--space-8);
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-2xl);
		box-shadow: var(--shadow-lg);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-6);
	}

	.logo {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: var(--radius-lg);
		background-color: var(--color-primary-soft);
		color: var(--color-primary);
	}

	.brand-name {
		font-size: var(--text-xl);
		font-weight: 700;
		color: var(--color-text);
	}
</style>
