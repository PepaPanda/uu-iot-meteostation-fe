<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		label?: string;
	}

	let { size = 'md', label = 'Načítám…' }: Props = $props();
</script>

<span class="spinner {size}" role="status" aria-label={label}></span>

<style>
	.spinner {
		display: inline-block;
		border: 2.5px solid var(--color-border-strong);
		border-right-color: var(--color-primary);
		border-radius: var(--radius-full);
		animation: spin 0.65s linear infinite;
	}

	.sm {
		width: 1rem;
		height: 1rem;
		border-width: 2px;
	}
	.md {
		width: 1.5rem;
		height: 1.5rem;
	}
	.lg {
		width: 2.5rem;
		height: 2.5rem;
		border-width: 3px;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
