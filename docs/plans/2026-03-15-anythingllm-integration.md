# AnythingLLM Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add ability to switch between Claude and AnythingLLM backends at runtime via slash commands.

**Architecture:** Add new `/api/anythingllm` endpoint that proxies to AnythingLLM's chat API. Modify `taskmaster.js` to support backend selection. Add `/use-claude` and `/use-anythingllm` slash commands that update session state.

**Tech Stack:** SvelteKit, SSE streaming, AnythingLLM API

---

### Task 1: Update .env.example with AnythingLLM config

**Files:**
- Modify: `.env.example`

**Step 1: Add AnythingLLM environment variables**

```sh
# Edit .env.example and add:
ANYTHING_LLM_API_KEY=your_anythingllm_api_key
ANYTHING_LLM_URL=http://localhost:3001
ANYTHING_LLM_WORKSPACE=your-workspace-slug
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add AnythingLLM env vars to .env.example"
```

---

### Task 2: Add backend store for tracking current AI backend

**Files:**
- Modify: `src/lib/stores/session.js`

**Step 1: Add backend state to session store**

```javascript
// In createSession(), modify initial state:
const initial = { 
  messages: [], 
  initialized: false, 
  backend: 'claude' // 'claude' or 'anythingllm'
}

// Add setBackend method:
setBackend: (backend) => update(s => ({ ...s, backend })),
```

**Step 2: Run tests to verify store works**

Run: `npm run test -- --run src/lib/stores/session.test.js 2>/dev/null || echo "No session tests"`

**Step 3: Commit**

```bash
git add src/lib/stores/session.js
git commit -m "feat: add backend state to session store"
```

---

### Task 3: Create AnythingLLM API endpoint

**Files:**
- Create: `src/routes/api/anythingllm/+server.js`

**Step 1: Create the endpoint**

```javascript
import { env } from '$env/dynamic/private'
import { error } from '@sveltejs/kit'

export async function POST({ request }) {
  const apiKey = env.ANYTHING_LLM_API_KEY
  const baseUrl = env.ANYTHING_LLM_URL || 'http://localhost:3001'
  const workspace = env.ANYTHING_LLM_WORKSPACE

  if (!apiKey) {
    throw error(500, 'ANYTHING_LLM_API_KEY not configured')
  }
  if (!workspace) {
    throw error(500, 'ANYTHING_LLM_WORKSPACE not configured')
  }

  let body
  try {
    body = await request.json()
  } catch (e) {
    throw error(400, `Bad request body: ${e.message}`)
  }

  const userMessage = body.messages?.[body.messages.length - 1]?.content || ''

  try {
    const upstream = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        workspaceSlug: workspace,
        message: userMessage,
        mode: 'chat',
      }),
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      throw error(upstream.status, `AnythingLLM error ${upstream.status}: ${text}`)
    }

    const data = await upstream.json()
    return new Response(data.response || '', {
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch (e) {
    if (e.status) throw e
    throw error(502, `Cannot reach AnythingLLM: ${e.message}`)
  }
}
```

**Step 2: Commit**

```bash
git add src/routes/api/anythingllm/+server.js
git commit -m "feat: add AnythingLLM API endpoint"
```

---

### Task 4: Add backend switching to taskmaster.js

**Files:**
- Modify: `src/lib/api/taskmaster.js`

**Step 1: Add sendToAnythingLLM function**

```javascript
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
```

**Step 2: Modify sendToTaskmaster to accept backend parameter (optional, or use conditional in router)**

Instead, we'll handle the selection in router.js. Keep taskmaster.js as-is.

**Step 3: Commit**

```bash
git add src/lib/api/taskmaster.js
git commit -m "feat: add sendToAnythingLLM function"
```

---

### Task 5: Add backend switching slash commands

**Files:**
- Modify: `src/lib/commands/router.js`

**Step 1: Add cases for /use-claude and /use-anythingllm**

```javascript
case 'use-claude':
  return handleUseBackend('claude', addBlock, sessionStore)
case 'use-anythingllm':
  return handleUseBackend('anythingllm', addBlock, sessionStore)
```

**Step 2: Add handler function**

```javascript
async function handleUseBackend(backend, addBlock, sessionStore) {
  sessionStore.setBackend(backend)
  const name = backend === 'claude' ? 'Claude' : 'AnythingLLM'
  addBlock({ type: 'SYSTEM', data: { type: 'confirm', message: `Switched to ${name} backend.` } })
}
```

**Step 3: Commit**

```bash
git add src/lib/commands/router.js
git commit -m "feat: add /use-claude and /use-anythingllm slash commands"
```

---

### Task 6: Modify main page to use selected backend

**Files:**
- Modify: `src/routes/+page.svelte`

**Step 1: Check current backend in handleSubmit and route accordingly**

The current code in +page.svelte calls `sendToTaskmaster` directly. We need to:
1. Get current backend from session store
2. Call appropriate function based on backend

```javascript
// In handleSubmit, replace the sendToTaskmaster call with:
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
```

**Step 2: Add import for sendToAnythingLLM**

```javascript
import { sendToTaskmaster, sendToAnythingLLM, TASKMASTER_SYSTEM_PROMPT } from '$lib/api/taskmaster.js'
```

**Step 3: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: route chat to selected backend"
```

---

### Task 7: Test end-to-end

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Test slash commands**
- Type `/use-anythingllm` - should show confirmation
- Type `/use-claude` - should show confirmation
- Send a message and verify it routes correctly

**Step 3: Commit**

```bash
git add .
git commit -m "test: verify AnythingLLM integration"
```

---

### Task 8: Push to main

**Step 1: Push**

```bash
git push origin main
```
