<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'value'> {
		value?: string | number;
		invalid?: boolean;
	}

	let {
		value = $bindable(''),
		invalid = false,
		type = 'text',
		class: className = '',
		...rest
	}: Props = $props();
</script>

<input
	class="input {className}"
	class:invalid
	{type}
	bind:value
	aria-invalid={invalid ? 'true' : undefined}
	{...rest}
/>

<style>
	.input {
		width: 100%;
		padding: 0.55rem 0.75rem;
		font-size: var(--text-sm);
		color: var(--color-text);
		background-color: var(--color-surface);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.input::placeholder {
		color: var(--color-text-subtle);
	}

	.input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgb(37 99 235 / 0.15);
	}

	.input:disabled {
		background-color: var(--color-surface-muted);
		color: var(--color-text-muted);
		cursor: not-allowed;
	}

	.invalid {
		border-color: var(--color-danger);
	}

	.invalid:focus {
		border-color: var(--color-danger);
		box-shadow: 0 0 0 3px rgb(220 38 38 / 0.15);
	}
</style>
