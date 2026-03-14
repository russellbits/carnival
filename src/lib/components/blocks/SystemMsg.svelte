<script>
  export let data = { type: 'info', message: '' }

  const prefixes = {
    confirm: '[OK]',
    error: '[ERR]',
    warning: '[!]',
    info: '[i]',
  }

  $: prefix = prefixes[data.type] ?? '[i]'
</script>

<div class="system-msg system-msg--{data.type}">
  <span class="prefix">{prefix}</span>
  <span class="message">{data.message}</span>
</div>

<style>
  .system-msg {
    color: var(--color-system);
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    padding: var(--space-xs) 0;
    display: flex;
    gap: var(--space-sm);
  }
  .system-msg--error { color: var(--color-danger); }
  .system-msg--warning { color: var(--color-warning); }
  .prefix { opacity: 0.7; }
</style>
