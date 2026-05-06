<script lang="ts">
  const props = $props<{ status?: 'online' | 'offline' | 'unknown' | null }>();

  const status = $derived(props.status ?? 'unknown');

  const className = $derived(
    status === 'online'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
      : status === 'offline'
        ? 'bg-red-50 text-red-700 ring-red-100'
        : 'bg-slate-100 text-slate-600 ring-slate-200'
  );
</script>

<span
  class={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${className}`}
>
  <span
    class={`mr-1.5 h-1.5 w-1.5 rounded-full ${
      status === 'online'
        ? 'bg-emerald-500'
        : status === 'offline'
          ? 'bg-red-500'
          : 'bg-slate-400'
    }`}
  ></span>

  {status}
</span>