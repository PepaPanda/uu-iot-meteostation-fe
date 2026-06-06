<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';

	interface Option {
		value: string;
		label: string;
	}

	interface Props extends Omit<HTMLSelectAttributes, 'value'> {
		value?: string;
		invalid?: boolean;
		options?: Option[];
		placeholder?: string;
		children?: Snippet;
	}

	let {
		value = $bindable(''),
		invalid = false,
		options,
		placeholder,
		class: className = '',
		children,
		...rest
	}: Props = $props();
</script>

<div class="select-wrap {className}" class:invalid>
	<select bind:value aria-invalid={invalid ? 'true' : undefined} {...rest}>
		{#if placeholder}
			<option value="" disabled>{placeholder}</option>
		{/if}
		{#if options}
			{#each options as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		{:else if children}
			{@render children()}
		{/if}
	</select>
	<span class="chevron" aria-hidden="true">▾</span>
</div>

<style>
	.select-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	select {
		width: 100%;
		appearance: none;
		padding: 0.55rem 2rem 0.55rem 0.75rem;
		font-size: var(--text-sm);
		color: var(--color-text);
		background-color: var(--color-surface);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgb(37 99 235 / 0.15);
	}

	select:disabled {
		background-color: var(--color-surface-muted);
		color: var(--color-text-muted);
		cursor: not-allowed;
	}

	.invalid select {
		border-color: var(--color-danger);
	}

	.chevron {
		position: absolute;
		right: 0.75rem;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		pointer-events: none;
	}
</style>
