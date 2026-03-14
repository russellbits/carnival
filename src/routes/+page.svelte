<script>
  import TitleCard from '$lib/components/TitleCard.svelte'
  import ChatStream from '$lib/components/ChatStream.svelte'
  import CommandInput from '$lib/components/CommandInput.svelte'
  import { createParser } from '$lib/parser/streamParser.js'
  import { sendToTaskmaster, TASKMASTER_SYSTEM_PROMPT } from '$lib/api/taskmaster.js'
  import { sessionStore } from '$lib/stores/session.js'
  import { handleSlashCommand, isSlashCommand } from '$lib/commands/router.js'

  let blocks = $state([])
  let inputEl = $state(null)
  let streaming = $state(false)

  function addBlock(block) {
    blocks = [...blocks, block]
  }

  async function handleSubmit({ value }) {
    if (!value) return

    // Echo user input as prose
    addBlock({ type: 'prose', text: `>> ${value}` })
    sessionStore.addMessage({ role: 'user', content: value })

    if (isSlashCommand(value)) {
      await handleSlashCommand(value, addBlock, sessionStore)
      return
    }

    // Natural language → Taskmaster
    streaming = true
    const parser = createParser(addBlock)
    let assistantText = ''

    await sendToTaskmaster(
      $sessionStore.messages,
      TASKMASTER_SYSTEM_PROMPT,
      (chunk) => {
        assistantText += chunk
        parser(chunk)
      },
      () => {
        parser(null) // flush
        sessionStore.addMessage({ role: 'assistant', content: assistantText })
        streaming = false
      }
    )
  }

  function refocusInput() {
    inputEl?.focus()
  }
</script>

<svelte:head>
  <title>Carnival</title>
</svelte:head>

<TitleCard />
<ChatStream {blocks} onRefocus={refocusInput} />
<CommandInput bind:this={inputEl} onsubmit={handleSubmit} />
