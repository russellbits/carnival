import { get } from 'svelte/store'
import { sendToTaskmaster, TASKMASTER_SYSTEM_PROMPT } from '$lib/api/taskmaster.js'
import { createParser } from '$lib/parser/streamParser.js'
import { character } from '$lib/stores/character.js'

export function isSlashCommand(input) {
  return typeof input === 'string' && input.startsWith('/')
}

export function parseCommand(input) {
  const parts = input.slice(1).split(/\s+/)
  const cmd = parts[0] ?? ''
  const args = parts.slice(1).join(' ')
  return { cmd, args }
}

/**
 * Handle a slash command.
 * @param {string} input - raw command string (e.g. "/start")
 * @param {function} addBlock - emit a block to the UI
 * @param {object} sessionStore - the session store
 */
export async function handleSlashCommand(input, addBlock, sessionStore) {
  const { cmd, args } = parseCommand(input)

  switch (cmd) {
    case 'start':
      return handleStart(addBlock, sessionStore)
    case 'inbox':
      return handleInbox(addBlock, sessionStore)
    case 'add':
      return handleAdd(args, addBlock)
    case 'complete':
      return handleComplete(args, addBlock, sessionStore)
    case 'stats':
      return handleStats(addBlock, sessionStore)
    case 'scene':
      return relayToTaskmaster('Describe the current scene and atmosphere.', addBlock, sessionStore)
    case 'next':
      return relayToTaskmaster('Present my next challenges.', addBlock, sessionStore)
    case 'story':
      return relayToTaskmaster('Summarize the story so far.', addBlock, sessionStore)
    case 'restart':
      sessionStore.clear()
      addBlock({ type: 'SYSTEM', data: { type: 'confirm', message: 'Session cleared. Type /start to begin.' } })
      break
    case 'use-claude':
      return handleUseBackend('claude', addBlock, sessionStore)
    case 'use-anythingllm':
      return handleUseBackend('anythingllm', addBlock, sessionStore)
    default:
      addBlock({ type: 'SYSTEM', data: { type: 'error', message: `Unknown command: /${cmd}` } })
  }
}

async function relayToTaskmaster(message, addBlock, sessionStore) {
  if (!get(sessionStore).initialized) {
    sessionStore.setInitialized()
  }
  sessionStore.addMessage({ role: 'user', content: message })
  const parser = createParser(addBlock)
  let assistantText = ''
  const messages = get(sessionStore).messages ?? []
  await sendToTaskmaster(
    messages,
    TASKMASTER_SYSTEM_PROMPT,
    (chunk) => { assistantText += chunk; parser(chunk) },
    () => { parser(null); sessionStore.addMessage({ role: 'assistant', content: assistantText }) }
  )
}

async function handleStart(addBlock, sessionStore) {
  addBlock({ type: 'SYSTEM', data: { type: 'info', message: 'Loading character and tasks...' } })
  try {
    const [todoRes, charRes] = await Promise.all([
      fetch('/api/files/todo'),
      fetch('/api/files/character'),
    ])
    const todo = todoRes.ok ? await todoRes.text() : ''
    const charData = charRes.ok ? await charRes.text() : ''
    const aOnly = todo.split('\n').filter(l => l.startsWith('(A)') || l.trim() === '').join('\n')
    const initMessage = `Initialize the game session. Here is my character data:\n\n${charData}\n\nHere are my current A-priority tasks:\n\n${aOnly}\n\nBegin the session with [STATS], [SCENE], then prose intro, then [TASKLIST].`
    sessionStore.setInitialized()
    await relayToTaskmaster(initMessage, addBlock, sessionStore)
  } catch (err) {
    addBlock({ type: 'SYSTEM', data: { type: 'error', message: `Failed to load game data: ${err.message}` } })
  }
}

async function handleInbox(addBlock, sessionStore) {
  try {
    const res = await fetch('/api/files/todo')
    const todo = res.ok ? await res.text() : ''
    await relayToTaskmaster(`Show me my full inbox: ${todo}`, addBlock, sessionStore)
  } catch {
    addBlock({ type: 'SYSTEM', data: { type: 'error', message: 'Failed to load todo.txt' } })
  }
}

async function handleAdd(task, addBlock) {
  try {
    await fetch('/api/files/todo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', task }),
    })
    addBlock({ type: 'SYSTEM', data: { type: 'confirm', message: `Task added: ${task}` } })
  } catch {
    addBlock({ type: 'SYSTEM', data: { type: 'error', message: 'Failed to add task' } })
  }
}

async function handleComplete(n, addBlock, sessionStore) {
  try {
    await fetch('/api/files/todo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', n: parseInt(n) }),
    })
    await relayToTaskmaster(`Task #${n} is complete. Completing it triggers a dungeon encounter — describe the monster or obstacle that now appears (themed to the task's domain, NOT a literal description of the task itself). Roll dice to resolve the fight. The player may win, take damage, or die — outcome follows the dice. Emit [ENCOUNTER], [DICEROLL], and updated [STATS]. Award XP and loot only on success via [AWARD].`, addBlock, sessionStore)
  } catch {
    addBlock({ type: 'SYSTEM', data: { type: 'error', message: 'Failed to complete task' } })
  }
}

function handleStats(addBlock, sessionStore) {
  if (!get(sessionStore).initialized) {
    sessionStore.setInitialized()
  }
  const data = get(character)
  if (!data) {
    addBlock({ type: 'SYSTEM', data: { type: 'warning', message: 'No character data loaded. Use /start first.' } })
    return
  }
  addBlock({ type: 'STATS', data })
}

async function handleUseBackend(backend, addBlock, sessionStore) {
  sessionStore.setBackend(backend)
  const name = backend === 'claude' ? 'Claude' : 'AnythingLLM'
  addBlock({ type: 'SYSTEM', data: { type: 'confirm', message: `Switched to ${name} backend.` } })
}
