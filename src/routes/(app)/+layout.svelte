<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Snippet } from 'svelte';
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { authState } from '$lib/features/auth/auth-state.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	$effect(() => {
		if (authState.isResolved && !authState.isAuthenticated) {
			void goto('/login');
		}
	});
</script>

{#if authState.isAuthenticated}
	<AppShell>
		{@render children()}
	</AppShell>
{:else}
	<div class="center"><Spinner size="lg" /></div>
{/if}

<style>
	.center {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
	}
</style>
