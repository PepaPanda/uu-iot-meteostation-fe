<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { authState } from '$lib/features/auth/auth-state.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	onMount(() => {
		// Resolve the current session once when the app boots. Errors (including
		// "not logged in") are handled inside refresh(); swallow rejections so a
		// missing/expired session never crashes the app.
		if (authState.status === 'idle') {
			void authState.refresh().catch(() => undefined);
		}
	});
</script>

{@render children()}
