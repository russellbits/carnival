<script>
  import HomeScreen from '$lib/components/HomeScreen.svelte'
  import ChatStream from '$lib/components/ChatStream.svelte'
  import CommandInput from '$lib/components/CommandInput.svelte'
  import QuickNav from '$lib/components/QuickNav.svelte'
  import { createParser } from '$lib/parser/streamParser.js'
  import { sendToTaskmaster, sendToAnythingLLM, TASKMASTER_SYSTEM_PROMPT } from '$lib/api/taskmaster.js'
  import { sessionStore } from '$lib/stores/session.js'
  import { handleSlashCommand, isSlashCommand } from '$lib/commands/router.js'

  let blocks = $state([])
  let inputEl = $state(null)
  let streaming = $state(false)
  let fading = $state(false)
  let gameReady = $state(false)

  const FADE_MS = 1400

  function addBlock(block) {
    blocks = [...blocks, block]
  }

  // When session initializes, wait for fade to finish before switching view
  $effect(() => {
    if ($sessionStore.initialized && !gameReady) {
      setTimeout(() => { gameReady = true }, FADE_MS)
    }
  })

  async function handleSubmit({ value }) {
    if (!value) return

    // Start fading home screen on first interaction
    if (!gameReady) fading = true

    addBlock({ type: 'prose', text: `>> ${value}` })
    sessionStore.addMessage({ role: 'user', content: value })

    if (isSlashCommand(value)) {
      await handleSlashCommand(value, addBlock, sessionStore)
      return
    }

    streaming = true
    const parser = createParser(addBlock)
    let assistantText = ''
    const backend = $sessionStore.backend || 'claude'

    if (backend === 'anythingllm') {
      await sendToAnythingLLM(
        $sessionStore.messages,
        TASKMASTER_SYSTEM_PROMPT,
        (chunk) => { assistantText += chunk; parser(chunk) },
        () => { parser(null); sessionStore.addMessage({ role: 'assistant', content: assistantText }); streaming = false }
      )
    } else {
      await sendToTaskmaster(
        $sessionStore.messages,
        TASKMASTER_SYSTEM_PROMPT,
        (chunk) => { assistantText += chunk; parser(chunk) },
        () => { parser(null); sessionStore.addMessage({ role: 'assistant', content: assistantText }); streaming = false }
      )
    }
  }

  function handleCommand(cmd) {
    handleSubmit({ value: cmd })
    inputEl?.focus()
  }

  function refocusInput() {
    inputEl?.focus()
  }
</script>

<svelte:head>
  <title>Carnival</title>
</svelte:head>

{#if !gameReady}
  <div class="home-wrapper" class:fading>
    <HomeScreen onCommand={handleCommand} />
    <CommandInput bind:this={inputEl} onsubmit={handleSubmit} />
  </div>
{:else}
  <div class="game-wrapper">
    <ChatStream {blocks} onRefocus={refocusInput} />
    <QuickNav onCommand={handleCommand} />
    <CommandInput bind:this={inputEl} onsubmit={handleSubmit} />
  </div>
{/if}

<style>
  .home-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
    opacity: 1;
    transition: opacity 1.4s cubic-bezier(0.4, 0, 1, 1);
  }

  .home-wrapper.fading {
    opacity: 0;
  }

  .game-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
  }
</style>
