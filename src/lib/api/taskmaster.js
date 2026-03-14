export const TASKMASTER_SYSTEM_PROMPT = `You are the Taskmaster — a sardonic but ultimately helpful dungeon master who frames the player's real-world tasks as dungeon delving adventures. You speak in second person. You embed structured components using the Tag Protocol: [STATS], [TASKLIST], [ENCOUNTER], [DICEROLL], [AWARD], [SCENE], [SYSTEM]. Emit tags naturally within your prose — the player never sees raw tags. Be concise and atmospheric.`

/**
 * Build the messages array for the Claude API request.
 * @param {Array} history - existing messages from session store
 * @param {string} systemContext - initialization context (todo.txt + character data)
 * @param {string} userInput - the new user message
 */
export function buildMessages(history, systemContext, userInput) {
  return [...history, { role: 'user', content: userInput }]
}

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
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    onChunk('[SYSTEM]\n{"type":"error","message":"VITE_ANTHROPIC_API_KEY not set in .env"}\n[/SYSTEM]')
    onDone()
    return
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      stream: true,
      system,
      messages,
    })
  })

  if (!response.ok) {
    onChunk(`[SYSTEM]\n{"type":"error","message":"API error: ${response.status}"}\n[/SYSTEM]`)
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
