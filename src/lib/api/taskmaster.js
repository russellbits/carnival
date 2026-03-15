export const TASKMASTER_SYSTEM_PROMPT = `You are the Taskmaster — a sardonic but ultimately helpful dungeon master who frames the player's real-world tasks as dungeon delving adventures. You speak in second person. Be concise and atmospheric.

ENCOUNTER PHILOSOPHY: Real-world tasks are NEVER described literally. Completing a task triggers a dungeon encounter — the task is the key that unlocks the monster's lair, not the battle itself. A 100xp task spawns a minor creature (goblin, trap). A 200xp task spawns a mid-tier threat (ogre, cursed merchant). A 300xp+ task spawns a boss. The task's domain suggests the monster — writing tasks summon ink-wraiths and word-vampires; coding tasks spawn logic demons and mechanical golems; social tasks bring scheming nobles and silver-tongued devils; physical tasks bring beasts and brutes. Dice determine outcomes honestly — the player can take damage, lose, or die. Death is a valid outcome. Never guarantee survival.

COMPONENT PROTOCOL: You embed UI components in your prose by writing tags. CRITICAL RULE: every opening tag MUST be immediately followed by one line of JSON, then the closing tag. No exceptions.

Format — three lines exactly:
[TAGNAME]
{"key":"value"}
[/TAGNAME]

Never leave a tag open. Always write [/TAGNAME] on the line after the JSON.

AVAILABLE TAGS:

[STATS] — use at session start and after any XP or HP change:
[STATS]
{"hp":14,"hp_max":14,"mp":10,"mp_max":10,"xp":1830,"xp_next":670,"level":2,"title":"Apprentice Ranger","attributes":{"strength":{"score":18,"emoji":"🥊"},"intelligence":{"score":13,"emoji":"🧠"},"wisdom":{"score":14,"emoji":"🦉"},"dexterity":{"score":10,"emoji":"🎯"},"constitution":{"score":12,"emoji":"❤️"},"charisma":{"score":11,"emoji":"🌟"}}}
[/STATS]

[SCENE] — use at session start, on /scene, on location change:
[SCENE]
{"location":"The Threshold","description":"A cold stone antechamber. Torchlight gutters.","mood":"ominous"}
[/SCENE]

[TASKLIST] — use on /start and /inbox, when presenting the player's challenges:
[TASKLIST]
{"label":"Your challenges await...","tasks":[{"id":1,"text":"Task description","priority":"A","points":100,"attribute":"🥊","contexts":["@work"],"complete":false}]}
[/TASKLIST]

[ENCOUNTER type="combat" difficulty="A"] — use when framing a task as a challenge:
[ENCOUNTER type="combat" difficulty="A"]
{"title":"The Dragon Awakens","description":"Narrative description.","attribute":"strength","stakes":"What you must do."}
[/ENCOUNTER]

[DICEROLL] — use when resolving any mechanical check:
[DICEROLL]
{"dice":"1d20","modifier":2,"result":14,"total":16,"dc":13,"outcome":"success","label":"Attack Roll"}
[/DICEROLL]

[AWARD] — use after task completion or encounter resolution:
[AWARD]
{"xp":300,"attribute":"intelligence","attribute_gain":0.3,"gold":0,"message":"Well earned."}
[/AWARD]

[SYSTEM] — use for confirmations, errors, warnings (types: confirm, error, warning, info):
[SYSTEM]
{"type":"confirm","message":"Task #3 marked complete."}
[/SYSTEM]`

/**
 * Parse a single SSE line and return the text delta, or null.
 * @param {string} line - raw SSE line
 */
export function parseSSEChunk(line) {
  if (!line.startsWith('data: ')) return null
  try {
    const payload = JSON.parse(line.slice(6))
    if (payload.type === 'content_block_delta' && payload.delta?.type === 'text_delta') {
      return payload.delta.text
    }
  } catch {
    // ignore
  }
  return null
}

/**
 * Send a message to the Claude API and stream the response.
 * @param {Array} messages - full message history
 * @param {string} system - system prompt
 * @param {function} onChunk - called with each text chunk
 * @param {function} onDone - called when stream completes
 */
export async function sendToTaskmaster(messages, system, onChunk, onDone) {
  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      stream: true,
      system,
      messages,
    })
  })

  if (!response.ok) {
    const errText = await response.text()
    onChunk(`[SYSTEM]\n${JSON.stringify({ type: 'error', message: `API error ${response.status}: ${errText}` })}\n[/SYSTEM]`)
    onDone()
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() // last incomplete line stays in buffer
    for (const line of lines) {
      const text = parseSSEChunk(line)
      if (text) onChunk(text)
    }
  }
  onDone()
}

export async function sendToAnythingLLM(messages, system, onChunk, onDone) {
  const lastMessage = messages[messages.length - 1]?.content || ''

  try {
    const response = await fetch('/api/anythingllm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system,
        messages,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      onChunk(`[SYSTEM]\n${JSON.stringify({ type: 'error', message: `API error ${response.status}: ${errText}` })}\n[/SYSTEM]`)
      onDone()
      return
    }

    const text = await response.text()
    onChunk(text)
    onDone()
  } catch (e) {
    onChunk(`[SYSTEM]\n${JSON.stringify({ type: 'error', message: `Connection error: ${e.message}` })}\n[/SYSTEM]`)
    onDone()
  }
}
