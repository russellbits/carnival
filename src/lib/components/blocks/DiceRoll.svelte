<script>
  export let data = { dice: '1d20', modifier: 0, result: 0, total: 0, dc: null, outcome: 'success', label: '' }

  $: isCritical = data.outcome === 'critical_success' || data.outcome === 'critical_failure'
  $: isSuccess = data.outcome === 'success' || data.outcome === 'critical_success'
</script>

<div class="dice-roll dice-roll--{data.outcome}">
  <div class="label">{data.label}</div>
  <div class="roll-row">
    <img src="/assets/dice.png" alt="dice" class="dice-img" />
    <div class="notation">{data.dice}{data.modifier !== 0 ? (data.modifier > 0 ? '+' : '') + data.modifier : ''}</div>
  </div>
  <div class="result" class:critical={isCritical}>
    <span class="total">{data.total}</span>
    {#if data.dc}
      <span class="dc"> vs DC {data.dc}</span>
    {/if}
  </div>
  <div class="outcome" class:critical={isCritical}>
    {data.outcome.replace('_', ' ').toUpperCase()}
  </div>
</div>

<style>
  .dice-roll {
    border: var(--border-width) var(--border-style) var(--color-accent-dim);
    padding: var(--space-md);
    margin: var(--space-sm) 0;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-xs);
    align-items: center;
  }
  .label {
    font-size: var(--font-size-sm);
    color: var(--color-text-dim);
    grid-column: 1 / -1;
  }
  .roll-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
  .dice-img {
    width: 32px;
    height: 32px;
    image-rendering: pixelated;
    opacity: 0.8;
  }
  .notation {
    color: var(--color-text-dim);
    font-size: var(--font-size-sm);
  }
  .total {
    font-size: var(--font-size-xl);
    font-family: var(--font-display);
  }
  .dc { font-size: var(--font-size-sm); color: var(--color-text-dim); }
  .dice-roll--success .total,
  .dice-roll--critical_success .total { color: var(--color-success); }
  .dice-roll--failure .total,
  .dice-roll--critical_failure .total { color: var(--color-danger); }
  .outcome { font-size: var(--font-size-sm); }
  .outcome.critical { font-size: var(--font-size-base); font-weight: bold; }
</style>
