<script lang="ts">
  type Props = {
    label: string;
    value: string | number;
    unit?: string;
    icon?: string;
    change?: string;
  };

  let {
    label,
    value,
    unit = '',
    icon = '',
    change = ''
  }: Props = $props();
</script>

<div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <div class="mb-5 flex items-center gap-2 text-sm text-slate-500">
    {#if icon}
      <span>{icon}</span>
    {/if}
    <span>{label}</span>
  </div>

  <div class="flex items-end gap-1">
    <span class="text-2xl font-bold text-slate-900">{value}</span>
    {#if unit}
      <span class="pb-1 text-base font-semibold text-slate-600">{unit}</span>
    {/if}
  </div>

  {#if change}
    <p class="mt-4 text-sm font-medium text-emerald-600">{change}</p>
  {/if}
</div>
