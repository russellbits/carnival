<script>
  let { data = { title: '', description: '', attribute: '', stakes: '' }, attrs = { type: 'combat', difficulty: 'B' } } = $props()

  const typeColors = {
    combat: 'var(--color-danger)',
    puzzle: 'var(--color-warning)',
    social: 'var(--color-success)',
    obstacle: 'var(--color-warning)',
    discovery: 'var(--color-accent)',
    endurance: 'var(--color-danger)',
  }
  const borderColor = $derived(typeColors[attrs.type] ?? 'var(--color-accent)')
</script>

<div class="encounter encounter--{attrs.type}" style="--encounter-color: {borderColor}">
  <div class="header">
    <span class="title">{data.title}</span>
    <span class="meta">{attrs.type.toUpperCase()} · {attrs.difficulty}</span>
  </div>
  <p class="description">{data.description}</p>
  {#if data.stakes}
    <p class="stakes">{data.stakes}</p>
  {/if}
</div>

<style>
  .encounter {
    border: 2px var(--border-style) var(--encounter-color);
    padding: var(--space-md);
    margin: var(--space-md) 0;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: var(--space-sm);
  }
  .title {
    font-size: var(--font-size-xl);
    font-family: var(--font-display);
    color: var(--encounter-color);
  }
  .meta {
    font-size: var(--font-size-sm);
    color: var(--color-text-dim);
  }
  .description {
    line-height: var(--line-height-prose);
    margin-bottom: var(--space-sm);
  }
  .stakes {
    color: var(--encounter-color);
    font-style: italic;
    border-top: var(--border-width) var(--border-style) var(--encounter-color);
    padding-top: var(--space-sm);
    margin-top: var(--space-sm);
  }
</style>
