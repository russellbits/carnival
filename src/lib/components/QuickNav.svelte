<script>
  let { onCommand = () => {} } = $props()

  const buttons = [
    { label: 'LOGIN', cmd: null },
    { label: 'START', cmd: '/start' },
    { label: 'RECAP', cmd: '/story' },
    { label: 'INBOX', cmd: '/inbox' },
    { label: 'STATS', cmd: '/stats' },
  ]
</script>

<nav class="quick-nav">
  {#each buttons as btn}
    <button
      class="nav-btn"
      disabled={btn.cmd === null}
      onclick={() => btn.cmd && onCommand(btn.cmd)}
    >{btn.label}</button>
  {/each}
</nav>

<style>
  .quick-nav {
    display: flex;
    gap: var(--space-sm);
    padding: var(--space-xs) var(--space-lg);
    border-top: var(--border-width) var(--border-style) var(--border-color);
    flex-shrink: 0;
  }

  .nav-btn {
    font-family: var(--font-display);
    font-size: var(--font-size-sm);
    color: var(--color-bg);
    background: var(--color-accent);
    border: var(--border-width) var(--border-style) var(--color-accent);
    padding: 2px var(--space-sm);
    cursor: pointer;
    letter-spacing: 0.1em;
    transition: background 0.15s, color 0.15s;
  }

  .nav-btn:hover:not(:disabled) {
    background: var(--color-bg);
    color: var(--color-accent);
  }

  .nav-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
</style>
