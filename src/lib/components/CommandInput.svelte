<script>
  let { onsubmit } = $props()

  let input = $state('')
  let history = $state([])
  let historyIndex = $state(-1)
  let inputEl

  export function focus() {
    inputEl?.focus()
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') {
      if (!input.trim()) return
      history = [input, ...history].slice(0, 50)
      historyIndex = -1
      onsubmit?.({ value: input.trim() })
      input = ''
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (historyIndex < history.length - 1) {
        historyIndex++
        input = history[historyIndex]
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        historyIndex--
        input = history[historyIndex]
      } else {
        historyIndex = -1
        input = ''
      }
    }
  }
</script>

<div class="input-row">
  <span class="prompt">&gt;&gt;</span>
  <input
    bind:this={inputEl}
    bind:value={input}
    onkeydown={handleKeydown}
    autocomplete="off"
    spellcheck="false"
    aria-label="Command input"
  />
</div>

<style>
  .input-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md) var(--space-lg);
    border-top: var(--border-width) var(--border-style) var(--border-color);
    background: var(--color-bg-input);
    flex-shrink: 0;
  }
  .prompt {
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: var(--font-size-base);
    user-select: none;
  }
  input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-text);
    font-family: var(--font-mono);
    font-size: var(--font-size-base);
    caret-color: var(--color-accent);
  }
</style>
