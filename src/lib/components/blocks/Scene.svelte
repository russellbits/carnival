<script>
  export let data = { location: '', description: '', mood: 'neutral' }
</script>

<div class="scene scene--{data.mood}">
  <div class="location">{data.location}</div>
  <p class="description">{data.description}</p>
</div>

<style>
  .scene {
    border: var(--border-width) var(--border-style) var(--color-accent-dim);
    padding: var(--space-md);
    margin: var(--space-md) 0;
  }
  .location {
    font-size: var(--font-size-lg);
    font-family: var(--font-display);
    color: var(--color-accent);
    margin-bottom: var(--space-sm);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .description {
    color: var(--color-text-dim);
    line-height: var(--line-height-prose);
  }
</style>
