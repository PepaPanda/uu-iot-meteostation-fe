<script lang="ts">
	import Icon, { type IconName } from '$lib/components/ui/Icon.svelte';
	import { formatNumber } from '$lib/utils/format';

	interface Props {
		label: string;
		value: number | null | undefined;
		unit?: string;
		decimals?: number;
		icon: IconName;
		accent?: string;
	}

	let { label, value, unit, decimals = 1, icon, accent = 'var(--color-primary)' }: Props = $props();
</script>

<div class="metric">
	<span class="icon" style={`color: ${accent}; background-color: ${accent}1a`}>
		<Icon name={icon} size={20} />
	</span>
	<div class="body">
		<span class="label">{label}</span>
		<span class="value">
			{formatNumber(value, { decimals })}{#if unit}<span class="unit">{unit}</span>{/if}
		</span>
	</div>
</div>

<style>
	.metric {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-5);
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-sm);
	}

	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: var(--radius-lg);
		flex-shrink: 0;
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.label {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.value {
		font-size: var(--text-2xl);
		font-weight: 700;
		color: var(--color-text);
		line-height: 1.1;
	}

	.unit {
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--color-text-muted);
		margin-left: 0.2rem;
	}
</style>
