<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	interface Props extends HTMLTextareaAttributes {
		value?: string;
		invalid?: boolean;
	}

	let {
		value = $bindable(''),
		invalid = false,
		rows = 4,
		class: className = '',
		...rest
	}: Props = $props();
</script>

<textarea
	class="textarea {className}"
	class:invalid
	{rows}
	bind:value
	aria-invalid={invalid ? 'true' : undefined}
	{...rest}
></textarea>

<style>
	.textarea {
		width: 100%;
		padding: 0.55rem 0.75rem;
		font-size: var(--text-sm);
		font-family: inherit;
		color: var(--color-text);
		background-color: var(--color-surface);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		resize: vertical;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.textarea::placeholder {
		color: var(--color-text-subtle);
	}

	.textarea:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgb(37 99 235 / 0.15);
	}

	.textarea:disabled {
		background-color: var(--color-surface-muted);
		color: var(--color-text-muted);
		cursor: not-allowed;
	}

	.invalid {
		border-color: var(--color-danger);
	}
</style>
