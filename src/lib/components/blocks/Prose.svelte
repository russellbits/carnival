<script>
  let { text = '' } = $props()

  let displayed = $state('')
  let done = $state(false)

  $effect(() => {
    // Reset when text changes
    displayed = ''
    done = false

    if (!text) return

    // Speed scales so long texts don't drag — floor at 6ms/char
    const speed = Math.max(6, Math.min(25, 1500 / text.length))
    let i = 0

    const id = setInterval(() => {
      i++
      displayed = text.slice(0, i)
      if (i >= text.length) {
        clearInterval(id)
        done = true
      }
    }, speed)

    return () => clearInterval(id)
  })

  function skip() {
    displayed = text
    done = true
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<p class="prose" class:done onclick={done ? null : skip}>{displayed}{#if !done}<span class="cursor">█</span>{/if}</p>

<style>
  .prose {
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: var(--font-size-base);
    line-height: var(--line-height-prose);
    margin-bottom: var(--space-sm);
    white-space: pre-wrap;
    cursor: pointer;
  }

  .prose.done {
    cursor: default;
  }

  .cursor {
    animation: blink 0.7s step-end infinite;
    color: var(--color-accent);
    font-size: 0.7em;
    vertical-align: middle;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
</style>
