<script>
  export let data = { xp: 0, attribute: '', attribute_gain: 0, gold: 0, message: '' }
</script>

<div class="award">
  <div class="xp-amount">+{data.xp} XP</div>
  {#if data.attribute}
    <div class="attribute-gain">
      {data.attribute} +{data.attribute_gain}
    </div>
  {/if}
  {#if data.gold}
    <div class="gold">+{data.gold} gold</div>
  {/if}
  {#if data.message}
    <p class="message">{data.message}</p>
  {/if}
</div>

<style>
  .award {
    border: var(--border-width) var(--border-style) var(--color-success);
    padding: var(--space-md);
    margin: var(--space-md) 0;
    text-align: center;
  }
  .xp-amount {
    font-size: var(--font-size-xl);
    color: var(--color-success);
    font-family: var(--font-display);
  }
  .attribute-gain, .gold {
    color: var(--color-text-dim);
    font-size: var(--font-size-sm);
    margin-top: var(--space-xs);
  }
  .message {
    margin-top: var(--space-sm);
    color: var(--color-text);
    font-style: italic;
  }
</style>
