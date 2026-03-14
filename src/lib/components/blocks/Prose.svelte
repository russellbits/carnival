<script>
  let { text = '' } = $props()
</script>

<p class="prose">{text}</p>

<style>
  .prose {
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: var(--font-size-base);
    line-height: var(--line-height-prose);
    margin-bottom: var(--space-sm);
    white-space: pre-wrap;
  }
</style>
