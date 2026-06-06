<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label?: string;
		for?: string;
		error?: string;
		hint?: string;
		required?: boolean;
		children: Snippet;
	}

	let { label, for: forId, error, hint, required = false, children }: Props = $props();
</script>

<div class="field" class:has-error={Boolean(error)}>
	{#if label}
		<label class="label" for={forId}>
			{label}
			{#if required}<span class="required" aria-hidden="true">*</span>{/if}
		</label>
	{/if}

	{@render children()}

	{#if error}
		<p class="message error">{error}</p>
	{:else if hint}
		<p class="message hint">{hint}</p>
	{/if}
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.label {
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--color-text);
	}

	.required {
		color: var(--color-danger);
		margin-left: 0.15rem;
	}

	.message {
		font-size: var(--text-xs);
	}

	.hint {
		color: var(--color-text-muted);
	}

	.error {
		color: var(--color-danger-soft-text);
	}
</style>
