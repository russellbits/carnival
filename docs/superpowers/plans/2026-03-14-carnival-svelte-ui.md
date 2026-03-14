# Carnival — Taskcraft Svelte UI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a streaming AI chat interface in SvelteKit that renders tagged text from the Claude API into interactive RPG-style components for the Taskcraft productivity game.

**Architecture:** SvelteKit app with a custom stream parser that intercepts bracketed tags (e.g. `[STATS]...[/STATS]`) in Claude's response stream and hydrates them into bespoke Svelte components. All styling uses CSS custom properties defined per-theme with no external component libraries. A SvelteKit server route handles local filesystem access for todo.txt and character.yaml.

**Tech Stack:** SvelteKit, Vite, Svelte 5, Storybook (@storybook/svelte-vite), Node.js, Claude API (claude-sonnet-4-6), CSS custom properties, no Tailwind

---

## Chunk 1: Project Setup & Theme System

### Task 1: Scaffold SvelteKit Project

**Files:**
- Create: `package.json` (generated)
- Create: `src/app.html`
- Create: `src/app.css`
- Create: `src/lib/themes/zork.css`
- Create: `.env.example`

- [ ] **Step 1: Create SvelteKit project**

```bash
cd /Users/russell/Development/carnival
npm create svelte@latest . -- --template minimal --types none --no-prettier --no-eslint
npm install
```

Expected: SvelteKit project created with `src/routes/+page.svelte` and `vite.config.js`

- [ ] **Step 2: Install Storybook**

```bash
npx storybook@latest init --type svelte
```

Expected: `.storybook/` directory and `src/stories/` created. Accept all prompts.

- [ ] **Step 3: Replace `src/app.html` shell**

Replace generated `src/app.html` with:

```html
<!doctype html>
<html lang="en" data-theme="zork">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body>
    <div id="svelte">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 4: Write failing test for theme variable existence**

Create `src/lib/themes/zork.test.css.js` — we'll use a simple DOM check via Storybook's preview instead. Skip to Step 5.

- [ ] **Step 5: Create `src/lib/themes/zork.css`**

```css
[data-theme="zork"] {
  /* Color */
  --color-bg:             #000000;
  --color-bg-surface:     #0a0a0a;
  --color-bg-input:       #000000;
  --color-text:           #00ff41;
  --color-text-dim:       #007a1f;
  --color-text-inverse:   #000000;
  --color-accent:         #00ff41;
  --color-accent-dim:     #004d13;
  --color-success:        #00ff41;
  --color-danger:         #ff3333;
  --color-warning:        #ffaa00;
  --color-system:         #007a1f;

  /* Typography */
  --font-mono:            "Courier New", "Lucida Console", monospace;
  --font-display:         "Courier New", monospace;
  --font-size-base:       16px;
  --font-size-sm:         13px;
  --font-size-lg:         20px;
  --font-size-xl:         28px;
  --line-height-prose:    1.7;

  /* Spacing */
  --space-xs:             4px;
  --space-sm:             8px;
  --space-md:             16px;
  --space-lg:             32px;
  --space-xl:             64px;

  /* Borders */
  --border-width:         1px;
  --border-style:         solid;
  --border-radius:        0;
  --border-color:         #00ff41;

  /* Animation */
  --cursor-blink-rate:    0.8s;
  --text-appear-speed:    12ms;
  --scanline-opacity:     0.03;
}
```

- [ ] **Step 6: Create `src/app.css`**

```css
@import './lib/themes/zork.css';

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  line-height: var(--line-height-prose);
}

/* CRT scanline overlay */
body::before {
  content: '';
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, var(--scanline-opacity)) 2px,
    rgba(0, 0, 0, var(--scanline-opacity)) 4px
  );
  pointer-events: none;
  z-index: 9999;
}

#svelte {
  height: 100%;
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 7: Update `.storybook/preview.js` to apply theme**

```js
// .storybook/preview.js
import '../src/app.css'

export const parameters = {
  backgrounds: { disable: true },
}

export const decorators = [
  (Story) => {
    document.documentElement.setAttribute('data-theme', 'zork')
    return Story()
  }
]
```

- [ ] **Step 8: Verify Storybook launches**

```bash
npm run storybook
```

Expected: Browser opens to Storybook with dark/green terminal background. No errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold SvelteKit project with Zork theme system"
```

---

## Chunk 2: Stream Parser

### Task 2: Tag Protocol Stream Parser

**Files:**
- Create: `src/lib/parser/streamParser.js`
- Create: `src/lib/parser/streamParser.test.js`

The parser is the most critical piece of logic. It must correctly handle: prose-only input, tag-only input, mixed input, malformed tags, and streamed input arriving in arbitrary chunk sizes.

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest
```

Add to `vite.config.js`:

```js
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.test.js'],
  }
})
```

- [ ] **Step 2: Write failing tests for the parser**

Create `src/lib/parser/streamParser.test.js`:

```js
import { describe, it, expect, vi } from 'vitest'
import { createParser } from './streamParser.js'

describe('streamParser', () => {
  function parse(chunks) {
    const blocks = []
    const write = createParser((block) => blocks.push(block))
    for (const chunk of chunks) write(chunk)
    write(null) // flush
    return blocks
  }

  it('emits a prose block for plain text', () => {
    const blocks = parse(['Hello, adventurer!'])
    expect(blocks).toEqual([{ type: 'prose', text: 'Hello, adventurer!' }])
  })

  it('emits a component block for a complete tag', () => {
    const blocks = parse(['[SYSTEM]\n{"type":"confirm","message":"OK"}\n[/SYSTEM]'])
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('SYSTEM')
    expect(blocks[0].data).toEqual({ type: 'confirm', message: 'OK' })
  })

  it('emits prose before and after a tag', () => {
    const blocks = parse(['Before\n[SYSTEM]\n{"type":"info","message":"hi"}\n[/SYSTEM]\nAfter'])
    expect(blocks[0]).toEqual({ type: 'prose', text: 'Before\n' })
    expect(blocks[1].type).toBe('SYSTEM')
    expect(blocks[2]).toEqual({ type: 'prose', text: '\nAfter' })
  })

  it('handles tags split across multiple chunks', () => {
    const blocks = parse([
      '[SYS',
      'TEM]\n{"type":"info","mess',
      'age":"hi"}\n[/SYSTEM]'
    ])
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('SYSTEM')
  })

  it('falls back to prose on malformed JSON', () => {
    const blocks = parse(['[SYSTEM]\nnot json\n[/SYSTEM]'])
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('prose')
    expect(blocks[0].text).toContain('[SYSTEM]')
  })

  it('parses tag attributes', () => {
    const blocks = parse(['[ENCOUNTER type="combat" difficulty="B"]\n{"title":"Wolves!"}\n[/ENCOUNTER]'])
    expect(blocks[0].attrs).toEqual({ type: 'combat', difficulty: 'B' })
  })

  it('handles self-closing tags', () => {
    const blocks = parse(['[SYSTEM data="{}"/]'])
    expect(blocks[0].type).toBe('SYSTEM')
  })

  it('treats unknown lowercase bracket text as prose', () => {
    const blocks = parse(['[not a tag] still prose'])
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('prose')
  })

  it('emits multiple blocks from one stream', () => {
    const input = 'Intro\n[SYSTEM]\n{"type":"info","message":"x"}\n[/SYSTEM]\nOutro'
    const blocks = parse([input])
    expect(blocks).toHaveLength(3)
  })
})
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
npx vitest run src/lib/parser/streamParser.test.js
```

Expected: All tests fail with "Cannot find module './streamParser.js'"

- [ ] **Step 4: Implement the parser**

Create `src/lib/parser/streamParser.js`:

```js
/**
 * Stream parser for the Tag Protocol.
 * Processes a text stream and emits typed block objects.
 * @param {function} onBlock - Called with each complete block
 * @returns {function} write - Call with each text chunk; call with null to flush
 */
export function createParser(onBlock) {
  const KNOWN_TAGS = ['STATS', 'TASKLIST', 'ENCOUNTER', 'DICEROLL', 'AWARD', 'SCENE', 'SYSTEM']

  let buffer = ''
  let mode = 'PROSE' // PROSE | TAG_OPEN | TAG_BODY
  let currentTag = null
  let currentAttrs = {}
  let tagBody = ''
  let proseBuffer = ''

  function flushProse() {
    if (proseBuffer) {
      onBlock({ type: 'prose', text: proseBuffer })
      proseBuffer = ''
    }
  }

  function parseAttrs(attrString) {
    const attrs = {}
    const re = /(\w+)="([^"]*)"/g
    let m
    while ((m = re.exec(attrString)) !== null) {
      attrs[m[1]] = m[2]
    }
    return attrs
  }

  function tryEmitTag(tagName, attrsStr, body) {
    try {
      const data = JSON.parse(body.trim())
      const attrs = parseAttrs(attrsStr)
      const block = { type: tagName, data }
      if (Object.keys(attrs).length) block.attrs = attrs
      onBlock(block)
      return true
    } catch {
      // Graceful degradation: emit raw as prose
      const raw = `[${tagName}${attrsStr ? ' ' + attrsStr : ''}]\n${body}\n[/${tagName}]`
      onBlock({ type: 'prose', text: raw })
      return false
    }
  }

  function process() {
    while (buffer.length > 0) {
      if (mode === 'PROSE') {
        const bracketIdx = buffer.indexOf('[')
        if (bracketIdx === -1) {
          proseBuffer += buffer
          buffer = ''
          break
        }
        // Check if the bracket starts a known tag
        const afterBracket = buffer.slice(bracketIdx + 1)
        const tagMatch = afterBracket.match(/^([A-Z]+)/)
        if (!tagMatch || !KNOWN_TAGS.includes(tagMatch[1])) {
          // Not a known tag — consume up to and including '[' as prose
          proseBuffer += buffer.slice(0, bracketIdx + 1)
          buffer = buffer.slice(bracketIdx + 1)
          continue
        }
        // Might be a tag — check if we have the full tag opener
        const openTagMatch = buffer.slice(bracketIdx).match(/^\[([A-Z]+)([^\]]*?)(\/\]|\])/)
        if (!openTagMatch) {
          // Incomplete tag opener — wait for more data
          proseBuffer += buffer.slice(0, bracketIdx)
          buffer = buffer.slice(bracketIdx)
          break
        }
        const [fullMatch, tagName, attrPart, closer] = openTagMatch
        if (!KNOWN_TAGS.includes(tagName)) {
          proseBuffer += buffer.slice(0, bracketIdx + fullMatch.length)
          buffer = buffer.slice(bracketIdx + fullMatch.length)
          continue
        }
        // Emit any accumulated prose before the tag
        proseBuffer += buffer.slice(0, bracketIdx)
        flushProse()
        buffer = buffer.slice(bracketIdx + fullMatch.length)

        if (closer === '/]') {
          // Self-closing
          tryEmitTag(tagName, attrPart.trim(), '{}')
        } else {
          mode = 'TAG_BODY'
          currentTag = tagName
          currentAttrs = attrPart.trim()
          tagBody = ''
        }
      } else if (mode === 'TAG_BODY') {
        const closeTag = `[/${currentTag}]`
        const closeIdx = buffer.indexOf(closeTag)
        if (closeIdx === -1) {
          tagBody += buffer
          buffer = ''
          break
        }
        tagBody += buffer.slice(0, closeIdx)
        buffer = buffer.slice(closeIdx + closeTag.length)
        tryEmitTag(currentTag, currentAttrs, tagBody)
        mode = 'PROSE'
        currentTag = null
        tagBody = ''
      }
    }
  }

  return function write(chunk) {
    if (chunk === null) {
      // Flush
      if (mode === 'TAG_BODY' && currentTag) {
        // Unclosed tag — emit as prose
        const raw = `[${currentTag}${currentAttrs ? ' ' + currentAttrs : ''}]\n${tagBody}`
        onBlock({ type: 'prose', text: proseBuffer + raw })
        proseBuffer = ''
      } else {
        proseBuffer += buffer
        flushProse()
      }
      buffer = ''
      return
    }
    buffer += chunk
    process()
  }
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run src/lib/parser/streamParser.test.js
```

Expected: All 9 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/parser/ vite.config.js
git commit -m "feat: implement Tag Protocol stream parser with full test coverage"
```

---

## Chunk 3: Svelte Stores

### Task 3: Session, Character, and Theme Stores

**Files:**
- Create: `src/lib/stores/session.js`
- Create: `src/lib/stores/character.js`
- Create: `src/lib/stores/theme.js`

- [ ] **Step 1: Write failing tests for stores**

Create `src/lib/stores/stores.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { get } from 'svelte/store'
import { session, addMessage, clearSession } from './session.js'
import { character, updateCharacter } from './character.js'
import { theme } from './theme.js'

describe('session store', () => {
  it('starts with empty messages and uninitialized', () => {
    clearSession()
    const s = get(session)
    expect(s.messages).toEqual([])
    expect(s.initialized).toBe(false)
  })

  it('addMessage appends to messages', () => {
    clearSession()
    addMessage({ role: 'user', content: 'hello' })
    const s = get(session)
    expect(s.messages).toHaveLength(1)
    expect(s.messages[0]).toEqual({ role: 'user', content: 'hello' })
  })

  it('clearSession resets to initial state', () => {
    addMessage({ role: 'user', content: 'test' })
    clearSession()
    expect(get(session).messages).toHaveLength(0)
  })
})

describe('character store', () => {
  it('starts null', () => {
    expect(get(character)).toBeNull()
  })

  it('updateCharacter sets character data', () => {
    updateCharacter({ hp: 14, hp_max: 14, xp: 1830, level: 2 })
    expect(get(character).hp).toBe(14)
  })
})

describe('theme store', () => {
  it('defaults to zork', () => {
    expect(get(theme)).toBe('zork')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/lib/stores/stores.test.js
```

Expected: Cannot find module errors.

- [ ] **Step 3: Create `src/lib/stores/session.js`**

```js
import { writable } from 'svelte/store'

function createSession() {
  const initial = { messages: [], initialized: false }
  const { subscribe, set, update } = writable({ ...initial })

  return {
    subscribe,
    addMessage: (msg) => update(s => ({
      ...s,
      messages: [...s.messages, msg]
    })),
    setInitialized: () => update(s => ({ ...s, initialized: true })),
    clear: () => set({ ...initial }),
  }
}

export const sessionStore = createSession()

// Named exports for test ergonomics
export const session = sessionStore
export const addMessage = sessionStore.addMessage
export const clearSession = sessionStore.clear
```

- [ ] **Step 4: Create `src/lib/stores/character.js`**

```js
import { writable } from 'svelte/store'

const { subscribe, set, update } = writable(null)

export const character = { subscribe, set, update }
export function updateCharacter(data) { set(data) }
```

- [ ] **Step 5: Create `src/lib/stores/theme.js`**

```js
import { writable } from 'svelte/store'

export const theme = writable('zork')
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
npx vitest run src/lib/stores/stores.test.js
```

Expected: All 5 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/stores/
git commit -m "feat: add session, character, and theme stores with tests"
```

---

## Chunk 4: Block Components

### Task 4: Prose, SystemMsg, and Scene Components

**Files:**
- Create: `src/lib/components/blocks/Prose.svelte`
- Create: `src/lib/components/blocks/SystemMsg.svelte`
- Create: `src/lib/components/blocks/Scene.svelte`
- Create: `src/lib/components/blocks/Prose.stories.js`
- Create: `src/lib/components/blocks/SystemMsg.stories.js`
- Create: `src/lib/components/blocks/Scene.stories.js`

- [ ] **Step 1: Create `src/lib/components/blocks/Prose.svelte`**

```svelte
<script>
  export let text = ''
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
```

- [ ] **Step 2: Create `src/lib/components/blocks/SystemMsg.svelte`**

```svelte
<script>
  export let data = { type: 'info', message: '' }

  const prefixes = {
    confirm: '[OK]',
    error: '[ERR]',
    warning: '[!]',
    info: '[i]',
  }

  $: prefix = prefixes[data.type] ?? '[i]'
</script>

<div class="system-msg system-msg--{data.type}">
  <span class="prefix">{prefix}</span>
  <span class="message">{data.message}</span>
</div>

<style>
  .system-msg {
    color: var(--color-system);
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    padding: var(--space-xs) 0;
    display: flex;
    gap: var(--space-sm);
  }
  .system-msg--error { color: var(--color-danger); }
  .system-msg--warning { color: var(--color-warning); }
  .prefix { opacity: 0.7; }
</style>
```

- [ ] **Step 3: Create `src/lib/components/blocks/Scene.svelte`**

```svelte
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
```

- [ ] **Step 4: Create Storybook stories for all three**

Create `src/lib/components/blocks/Prose.stories.js`:

```js
import Prose from './Prose.svelte'
export default { title: 'Blocks/Prose', component: Prose }
export const Default = { args: { text: 'You step into the darkened corridor. The air smells of damp stone and ancient magic.' } }
export const MultiLine = { args: { text: 'First line.\nSecond line.\nThird line.' } }
```

Create `src/lib/components/blocks/SystemMsg.stories.js`:

```js
import SystemMsg from './SystemMsg.svelte'
export default { title: 'Blocks/SystemMsg', component: SystemMsg }
export const Confirm = { args: { data: { type: 'confirm', message: 'Task #3 marked complete. done.txt updated.' } } }
export const Error = { args: { data: { type: 'error', message: 'Failed to read todo.txt.' } } }
export const Warning = { args: { data: { type: 'warning', message: 'API key not set.' } } }
export const Info = { args: { data: { type: 'info', message: 'Session initialized.' } } }
```

Create `src/lib/components/blocks/Scene.stories.js`:

```js
import Scene from './Scene.svelte'
export default { title: 'Blocks/Scene', component: Scene }
export const Ominous = { args: { data: { location: 'The Thornwood', description: 'Gnarled branches claw at a moonless sky. Something watches from the dark.', mood: 'ominous' } } }
export const Neutral = { args: { data: { location: 'The Village Tavern', description: 'Firelight flickers across worn wooden tables. The barkeep eyes you with mild curiosity.', mood: 'neutral' } } }
export const Welcoming = { args: { data: { location: 'Ranger\'s Outpost', description: 'A warm fire crackles in the hearth. Maps line every wall.', mood: 'welcoming' } } }
```

- [ ] **Step 5: Verify in Storybook**

```bash
npm run storybook
```

Expected: Prose, SystemMsg, and Scene components visible with all variants, styled in Zork green-on-black.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/blocks/
git commit -m "feat: add Prose, SystemMsg, and Scene block components with Storybook stories"
```

---

### Task 5: Award, DiceRoll Components

**Files:**
- Create: `src/lib/components/blocks/Award.svelte`
- Create: `src/lib/components/blocks/DiceRoll.svelte`
- Create: `src/lib/components/blocks/Award.stories.js`
- Create: `src/lib/components/blocks/DiceRoll.stories.js`

- [ ] **Step 1: Create `src/lib/components/blocks/Award.svelte`**

```svelte
<script>
  export let data = { xp: 0, attribute: '', attribute_gain: 0, gold: 0, message: '' }
</script>

<div class="award">
  <div class="xp-amount">+{data.xp} XP</div>
  {#if data.attribute}
    <div class="attribute-gain">
      {data.attribute} +{data.attribute_gain}
    </div>
  {/if}
  {#if data.gold}
    <div class="gold">+{data.gold} gold</div>
  {/if}
  {#if data.message}
    <p class="message">{data.message}</p>
  {/if}
</div>

<style>
  .award {
    border: var(--border-width) var(--border-style) var(--color-success);
    padding: var(--space-md);
    margin: var(--space-md) 0;
    text-align: center;
  }
  .xp-amount {
    font-size: var(--font-size-xl);
    color: var(--color-success);
    font-family: var(--font-display);
  }
  .attribute-gain, .gold {
    color: var(--color-text-dim);
    font-size: var(--font-size-sm);
    margin-top: var(--space-xs);
  }
  .message {
    margin-top: var(--space-sm);
    color: var(--color-text);
    font-style: italic;
  }
</style>
```

- [ ] **Step 2: Create `src/lib/components/blocks/DiceRoll.svelte`**

```svelte
<script>
  export let data = { dice: '1d20', modifier: 0, result: 0, total: 0, dc: null, outcome: 'success', label: '' }

  $: isCritical = data.outcome === 'critical_success' || data.outcome === 'critical_failure'
  $: isSuccess = data.outcome === 'success' || data.outcome === 'critical_success'
</script>

<div class="dice-roll dice-roll--{data.outcome}">
  <div class="label">{data.label}</div>
  <div class="roll-row">
    <img src="/assets/dice.png" alt="dice" class="dice-img" />
    <div class="notation">{data.dice}{data.modifier !== 0 ? (data.modifier > 0 ? '+' : '') + data.modifier : ''}</div>
  </div>
  <div class="result" class:critical={isCritical}>
    <span class="total">{data.total}</span>
    {#if data.dc}
      <span class="dc"> vs DC {data.dc}</span>
    {/if}
  </div>
  <div class="outcome" class:critical={isCritical}>
    {data.outcome.replace('_', ' ').toUpperCase()}
  </div>
</div>

<style>
  .dice-roll {
    border: var(--border-width) var(--border-style) var(--color-accent-dim);
    padding: var(--space-md);
    margin: var(--space-sm) 0;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-xs);
    align-items: center;
  }
  .label {
    font-size: var(--font-size-sm);
    color: var(--color-text-dim);
    grid-column: 1 / -1;
  }
  .roll-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
  .dice-img {
    width: 32px;
    height: 32px;
    image-rendering: pixelated;
    opacity: 0.8;
  }
  .notation {
    color: var(--color-text-dim);
    font-size: var(--font-size-sm);
  }
  .total {
    font-size: var(--font-size-xl);
    font-family: var(--font-display);
  }
  .dc { font-size: var(--font-size-sm); color: var(--color-text-dim); }
  .dice-roll--success .total,
  .dice-roll--critical_success .total { color: var(--color-success); }
  .dice-roll--failure .total,
  .dice-roll--critical_failure .total { color: var(--color-danger); }
  .outcome { font-size: var(--font-size-sm); }
  .outcome.critical { font-size: var(--font-size-base); font-weight: bold; }
</style>
```

- [ ] **Step 3: Create Storybook stories**

Create `src/lib/components/blocks/Award.stories.js`:

```js
import Award from './Award.svelte'
export default { title: 'Blocks/Award', component: Award }
export const XPOnly = { args: { data: { xp: 300, attribute: '', attribute_gain: 0, gold: 0, message: '' } } }
export const XPandGold = { args: { data: { xp: 150, attribute: '', attribute_gain: 0, gold: 25, message: 'The merchant rewards your quick work.' } } }
export const AttributeGain = { args: { data: { xp: 300, attribute: 'intelligence', attribute_gain: 0.3, gold: 0, message: 'The secret door yields its treasures to your keen mind.' } } }
export const LargeReward = { args: { data: { xp: 1000, attribute: 'wisdom', attribute_gain: 1.0, gold: 500, message: 'A legendary quest completed!' } } }
```

Create `src/lib/components/blocks/DiceRoll.stories.js`:

```js
import DiceRoll from './DiceRoll.svelte'
export default { title: 'Blocks/DiceRoll', component: DiceRoll }
export const CriticalSuccess = { args: { data: { dice: '1d20', modifier: 2, result: 20, total: 22, dc: 13, outcome: 'critical_success', label: 'Attack Roll' } } }
export const Success = { args: { data: { dice: '1d20', modifier: 2, result: 14, total: 16, dc: 13, outcome: 'success', label: 'Attack Roll' } } }
export const Failure = { args: { data: { dice: '1d20', modifier: 2, result: 3, total: 5, dc: 13, outcome: 'failure', label: 'Attack Roll' } } }
export const CriticalFailure = { args: { data: { dice: '1d20', modifier: 2, result: 1, total: 3, dc: 13, outcome: 'critical_failure', label: 'Attack Roll' } } }
export const NoModifier = { args: { data: { dice: '1d20', modifier: 0, result: 9, total: 9, dc: null, outcome: 'success', label: 'Perception Check' } } }
```

- [ ] **Step 4: Verify in Storybook**

```bash
npm run storybook
```

Expected: Award and DiceRoll visible with all variants.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/blocks/
git commit -m "feat: add Award and DiceRoll block components with Storybook stories"
```

---

### Task 6: StatsBlock, TaskList, and Encounter Components

**Files:**
- Create: `src/lib/components/blocks/StatsBlock.svelte`
- Create: `src/lib/components/blocks/TaskList.svelte`
- Create: `src/lib/components/blocks/Encounter.svelte`
- Create: `src/lib/components/blocks/StatsBlock.stories.js`
- Create: `src/lib/components/blocks/TaskList.stories.js`
- Create: `src/lib/components/blocks/Encounter.stories.js`

- [ ] **Step 1: Create `src/lib/components/blocks/StatsBlock.svelte`**

```svelte
<script>
  import { updateCharacter } from '$lib/stores/character.js'

  export let data = { hp: 0, hp_max: 0, mp: 0, mp_max: 0, xp: 0, xp_next: 0, level: 1, title: '', attributes: {} }

  $: { updateCharacter(data) }

  $: hpPct = data.hp_max > 0 ? (data.hp / data.hp_max) * 100 : 0
  $: xpPct = data.xp_next > 0 ? ((data.xp_next - data.xp) / data.xp_next) * 100 : 0
</script>

<div class="stats-block">
  <div class="header">
    <span class="title">{data.title}</span>
    <span class="level">Level {data.level}</span>
  </div>

  <div class="bars">
    <div class="bar-row">
      <span class="bar-label">HP</span>
      <div class="bar-track">
        <div class="bar-fill bar-fill--hp" style="width: {hpPct}%"></div>
      </div>
      <span class="bar-val">{data.hp}/{data.hp_max}</span>
    </div>
    <div class="bar-row">
      <span class="bar-label">XP</span>
      <div class="bar-track">
        <div class="bar-fill bar-fill--xp" style="width: {xpPct}%"></div>
      </div>
      <span class="bar-val">{data.xp_next} to next</span>
    </div>
  </div>

  <div class="attributes">
    {#each Object.entries(data.attributes) as [name, attr]}
      <div class="attr-bubble">
        <span class="attr-emoji">{attr.emoji}</span>
        <span class="attr-score">{attr.score}</span>
        <span class="attr-name">{name.slice(0, 3).toUpperCase()}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .stats-block {
    border: var(--border-width) var(--border-style) var(--border-color);
    padding: var(--space-md);
    margin: var(--space-md) 0;
  }
  .header {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--space-sm);
    font-size: var(--font-size-lg);
    color: var(--color-accent);
  }
  .bars { margin-bottom: var(--space-sm); }
  .bar-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-xs);
  }
  .bar-label { width: 2ch; font-size: var(--font-size-sm); color: var(--color-text-dim); }
  .bar-track {
    flex: 1;
    height: 8px;
    background: var(--color-accent-dim);
    border: var(--border-width) var(--border-style) var(--border-color);
  }
  .bar-fill { height: 100%; transition: width 0.3s ease; }
  .bar-fill--hp { background: var(--color-danger); }
  .bar-fill--xp { background: var(--color-success); }
  .bar-val { font-size: var(--font-size-sm); color: var(--color-text-dim); min-width: 10ch; text-align: right; }
  .attributes { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
  .attr-bubble {
    border: var(--border-width) var(--border-style) var(--border-color);
    padding: var(--space-xs) var(--space-sm);
    text-align: center;
    min-width: 52px;
  }
  .attr-emoji { display: block; font-size: var(--font-size-base); }
  .attr-score { display: block; font-size: var(--font-size-lg); color: var(--color-accent); }
  .attr-name { display: block; font-size: var(--font-size-sm); color: var(--color-text-dim); }
</style>
```

- [ ] **Step 2: Create `src/lib/components/blocks/TaskList.svelte`**

```svelte
<script>
  export let data = { label: '', tasks: [] }

  const priorityColors = { A: 'var(--color-danger)', B: 'var(--color-warning)', C: 'var(--color-success)', D: 'var(--color-text-dim)', E: 'var(--color-text-dim)' }
</script>

<div class="task-list">
  {#if data.label}
    <div class="label">{data.label}</div>
  {/if}
  <ol class="tasks">
    {#each data.tasks as task (task.id)}
      <li class="task" class:complete={task.complete}>
        <span class="priority" style="color: {priorityColors[task.priority] ?? 'inherit'}">[{task.priority}]</span>
        <span class="text">{task.text}</span>
        <span class="attr">{task.attribute}</span>
        <span class="points">+{task.points}xp</span>
      </li>
    {/each}
  </ol>
</div>

<style>
  .task-list {
    margin: var(--space-md) 0;
  }
  .label {
    color: var(--color-text-dim);
    font-size: var(--font-size-sm);
    margin-bottom: var(--space-sm);
  }
  .tasks {
    list-style: decimal;
    padding-left: var(--space-lg);
  }
  .task {
    display: flex;
    gap: var(--space-sm);
    padding: var(--space-xs) 0;
    align-items: baseline;
    font-size: var(--font-size-base);
  }
  .task.complete { opacity: 0.4; text-decoration: line-through; }
  .priority { font-family: var(--font-mono); min-width: 3ch; }
  .text { flex: 1; }
  .attr { font-size: var(--font-size-sm); }
  .points { font-size: var(--font-size-sm); color: var(--color-text-dim); min-width: 8ch; text-align: right; }
</style>
```

- [ ] **Step 3: Create `src/lib/components/blocks/Encounter.svelte`**

```svelte
<script>
  export let data = { title: '', description: '', attribute: '', stakes: '' }
  export let attrs = { type: 'combat', difficulty: 'B' }

  const typeColors = {
    combat: 'var(--color-danger)',
    puzzle: 'var(--color-warning)',
    social: 'var(--color-success)',
    obstacle: 'var(--color-warning)',
    discovery: 'var(--color-accent)',
    endurance: 'var(--color-danger)',
  }
  $: borderColor = typeColors[attrs.type] ?? 'var(--color-accent)'
</script>

<div class="encounter encounter--{attrs.type}" style="--encounter-color: {borderColor}">
  <div class="header">
    <span class="title">{data.title}</span>
    <span class="meta">{attrs.type.toUpperCase()} · {attrs.difficulty}</span>
  </div>
  <p class="description">{data.description}</p>
  {#if data.stakes}
    <p class="stakes">{data.stakes}</p>
  {/if}
</div>

<style>
  .encounter {
    border: 2px var(--border-style) var(--encounter-color);
    padding: var(--space-md);
    margin: var(--space-md) 0;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: var(--space-sm);
  }
  .title {
    font-size: var(--font-size-xl);
    font-family: var(--font-display);
    color: var(--encounter-color);
  }
  .meta {
    font-size: var(--font-size-sm);
    color: var(--color-text-dim);
  }
  .description {
    line-height: var(--line-height-prose);
    margin-bottom: var(--space-sm);
  }
  .stakes {
    color: var(--encounter-color);
    font-style: italic;
    border-top: var(--border-width) var(--border-style) var(--encounter-color);
    padding-top: var(--space-sm);
    margin-top: var(--space-sm);
  }
</style>
```

- [ ] **Step 4: Create Storybook stories**

Create `src/lib/components/blocks/StatsBlock.stories.js`:

```js
import StatsBlock from './StatsBlock.svelte'
export default { title: 'Blocks/StatsBlock', component: StatsBlock }

const attrs = { strength: { score: 18, emoji: '💪' }, intelligence: { score: 13, emoji: '🧠' }, wisdom: { score: 14, emoji: '🦉' }, dexterity: { score: 10, emoji: '🤹' }, constitution: { score: 12, emoji: '❤️' }, charisma: { score: 11, emoji: '🌟' } }

export const FullHP = { args: { data: { hp: 14, hp_max: 14, mp: 10, mp_max: 10, xp: 1830, xp_next: 670, level: 2, title: 'Apprentice Ranger', attributes: attrs } } }
export const LowHP = { args: { data: { hp: 3, hp_max: 14, mp: 10, mp_max: 10, xp: 1830, xp_next: 670, level: 2, title: 'Apprentice Ranger', attributes: attrs } } }
export const HighXP = { args: { data: { hp: 14, hp_max: 14, mp: 10, mp_max: 10, xp: 2400, xp_next: 100, level: 2, title: 'Apprentice Ranger', attributes: attrs } } }
export const LevelUp = { args: { data: { hp: 18, hp_max: 18, mp: 12, mp_max: 12, xp: 0, xp_next: 3000, level: 3, title: 'Journeyman Ranger', attributes: attrs } } }
```

Create `src/lib/components/blocks/TaskList.stories.js`:

```js
import TaskList from './TaskList.svelte'
export default { title: 'Blocks/TaskList', component: TaskList }

const tasks = [
  { id: 1, text: 'Rebuild content system', priority: 'A', points: 300, attribute: '🧠', contexts: ['@coding'], complete: false },
  { id: 2, text: 'Research vacation destinations', priority: 'B', points: 35, attribute: '🦉', contexts: ['@travel'], complete: true },
  { id: 3, text: 'Write quarterly report', priority: 'C', points: 150, attribute: '🌟', contexts: ['@work'], complete: false },
]

export const AllA = { args: { data: { label: 'Your challenges await...', tasks: tasks.filter(t => t.priority === 'A') } } }
export const Mixed = { args: { data: { label: 'All tasks', tasks } } }
export const SingleTask = { args: { data: { label: '', tasks: [tasks[0]] } } }
export const WithCompleted = { args: { data: { label: 'Progress', tasks } } }
```

Create `src/lib/components/blocks/Encounter.stories.js`:

```js
import Encounter from './Encounter.svelte'
export default { title: 'Blocks/Encounter', component: Encounter }

export const Combat = { args: { data: { title: 'Wolves!', description: 'Five wolves pour out of the frozen woods.', attribute: 'strength', stakes: 'You must act with code and attack the largest one!' }, attrs: { type: 'combat', difficulty: 'B' } } }
export const Puzzle = { args: { data: { title: 'The Sealed Door', description: 'Ancient runes glow faintly on a stone door.', attribute: 'intelligence', stakes: 'Decipher the runes to proceed.' }, attrs: { type: 'puzzle', difficulty: 'C' } } }
export const Social = { args: { data: { title: 'The Merchant', description: 'A cloaked merchant offers information — for a price.', attribute: 'charisma', stakes: 'Negotiate the terms.' }, attrs: { type: 'social', difficulty: 'D' } } }
export const Obstacle = { args: { data: { title: 'Flooded Path', description: 'The river runs high and cold after three days of rain.', attribute: 'constitution', stakes: 'Push through or find another way.' }, attrs: { type: 'obstacle', difficulty: 'B' } } }
export const Discovery = { args: { data: { title: 'Hidden Cache', description: 'Behind a loose stone in the wall, a hollow space.', attribute: 'wisdom', stakes: '' }, attrs: { type: 'discovery', difficulty: 'A' } } }
```

- [ ] **Step 5: Verify all components in Storybook**

```bash
npm run storybook
```

Expected: StatsBlock, TaskList, and Encounter visible with all variants. HP bar shows red for LowHP story.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/blocks/
git commit -m "feat: add StatsBlock, TaskList, and Encounter block components with Storybook stories"
```

---

## Chunk 5: API Layer

### Task 7: Taskmaster API Integration

**Files:**
- Create: `src/lib/api/taskmaster.js`
- Create: `src/lib/api/taskmaster.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/lib/api/taskmaster.test.js`:

```js
import { describe, it, expect, vi } from 'vitest'
import { buildMessages, parseSSEChunk } from './taskmaster.js'

describe('buildMessages', () => {
  it('prepends system content to first user message when messages are empty', () => {
    const msgs = buildMessages([], 'system prompt', 'user input')
    expect(msgs).toHaveLength(1)
    expect(msgs[0].role).toBe('user')
    expect(msgs[0].content).toBe('user input')
  })

  it('appends new user message to existing history', () => {
    const history = [{ role: 'user', content: 'hello' }, { role: 'assistant', content: 'hi' }]
    const msgs = buildMessages(history, 'system', 'new message')
    expect(msgs).toHaveLength(3)
    expect(msgs[2]).toEqual({ role: 'user', content: 'new message' })
  })
})

describe('parseSSEChunk', () => {
  it('returns null for non-data lines', () => {
    expect(parseSSEChunk('event: message_start')).toBeNull()
    expect(parseSSEChunk('')).toBeNull()
  })

  it('extracts text delta from content_block_delta event', () => {
    const line = 'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}'
    expect(parseSSEChunk(line)).toBe('Hello')
  })

  it('returns null for non-text delta events', () => {
    const line = 'data: {"type":"message_start"}'
    expect(parseSSEChunk(line)).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
npx vitest run src/lib/api/taskmaster.test.js
```

Expected: Cannot find module error.

- [ ] **Step 3: Create `src/lib/api/taskmaster.js`**

```js
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
    const err = await response.text()
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/lib/api/taskmaster.test.js
```

Expected: All 5 tests pass.

- [ ] **Step 5: Create `.env.example`**

```
VITE_ANTHROPIC_API_KEY=your_key_here
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/ .env.example
git commit -m "feat: add Claude API integration layer with SSE stream parsing"
```

---

## Chunk 6: Layout Components & Main Page

### Task 8: Static Assets, TitleCard, CommandInput, and ChatStream

**Files:**
- Create: `static/assets/.gitkeep` (directory scaffold)
- Create: `src/lib/commands/router.stub.js` → renamed to `src/lib/commands/router.js` (stub so page compiles)
- Create: `src/lib/components/TitleCard.svelte`
- Create: `src/lib/components/CommandInput.svelte`
- Create: `src/lib/components/ChatStream.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Create static assets directory and placeholder files**

```bash
mkdir -p static/assets
touch static/assets/title.png static/assets/portrait.png static/assets/dice.png
```

These are placeholder files. Replace with real assets before the first demo. `title.png` should be a green-on-black TASKCRAFT/CARNIVAL logotype. `dice.png` is the die face image rendered in `DiceRoll.svelte`. `portrait.png` is the character portrait for `StatsBlock.svelte`.

- [ ] **Step 2: Create router stub (enables `+page.svelte` to compile before Task 9)**

Create `src/lib/commands/router.js` as a stub — Task 9 replaces this with the full implementation:

```js
// Stub — full implementation in Task 9
export function isSlashCommand(input) {
  return typeof input === 'string' && input.startsWith('/')
}
export async function handleSlashCommand(input, addBlock) {
  addBlock({ type: 'SYSTEM', data: { type: 'info', message: `Command stub: ${input}` } })
}
```

- [ ] **Step 3: Create `src/lib/components/TitleCard.svelte`**

```svelte
<div class="title-card">
  <div class="title-text">CARNIVAL</div>
  <div class="subtitle">powered by Taskcraft</div>
</div>

<style>
  .title-card {
    padding: var(--space-md) var(--space-lg);
    border-bottom: var(--border-width) var(--border-style) var(--border-color);
    flex-shrink: 0;
  }
  .title-text {
    font-family: var(--font-display);
    font-size: var(--font-size-xl);
    color: var(--color-accent);
    letter-spacing: 0.3em;
  }
  .subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-dim);
  }
</style>
```

Note: Replace `<div class="title-text">CARNIVAL</div>` with `<img src="/assets/title.png" alt="CARNIVAL" class="title-img">` once the real asset is placed in `static/assets/`. The placeholder asset created in Step 1 will render as a broken image until replaced.

- [ ] **Step 4: Create `src/lib/components/CommandInput.svelte`**

```svelte
<script>
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  let input = ''
  let history = []
  let historyIndex = -1

  function handleKeydown(e) {
    if (e.key === 'Enter') {
      if (!input.trim()) return
      history = [input, ...history].slice(0, 50)
      historyIndex = -1
      dispatch('submit', { value: input.trim() })
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
    bind:value={input}
    on:keydown={handleKeydown}
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
```

- [ ] **Step 5: Create `src/lib/components/ChatStream.svelte`**

```svelte
<script>
  import { afterUpdate } from 'svelte'
  import Prose from './blocks/Prose.svelte'
  import StatsBlock from './blocks/StatsBlock.svelte'
  import TaskList from './blocks/TaskList.svelte'
  import Encounter from './blocks/Encounter.svelte'
  import DiceRoll from './blocks/DiceRoll.svelte'
  import Award from './blocks/Award.svelte'
  import Scene from './blocks/Scene.svelte'
  import SystemMsg from './blocks/SystemMsg.svelte'

  export let blocks = []
  export let onRefocus = () => {}

  let el

  afterUpdate(() => {
    if (el) el.scrollTop = el.scrollHeight
  })
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="chat-stream" bind:this={el} on:click={onRefocus}>
  {#each blocks as block, i (i)}
    {#if block.type === 'prose'}
      <Prose text={block.text} />
    {:else if block.type === 'STATS'}
      <StatsBlock data={block.data} />
    {:else if block.type === 'TASKLIST'}
      <TaskList data={block.data} />
    {:else if block.type === 'ENCOUNTER'}
      <Encounter data={block.data} attrs={block.attrs ?? {}} />
    {:else if block.type === 'DICEROLL'}
      <DiceRoll data={block.data} />
    {:else if block.type === 'AWARD'}
      <Award data={block.data} />
    {:else if block.type === 'SCENE'}
      <Scene data={block.data} />
    {:else if block.type === 'SYSTEM'}
      <SystemMsg data={block.data} />
    {/if}
  {/each}
</div>

<style>
  .chat-stream {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-lg);
    scroll-behavior: smooth;
  }
  .chat-stream::-webkit-scrollbar { width: 4px; }
  .chat-stream::-webkit-scrollbar-track { background: var(--color-bg); }
  .chat-stream::-webkit-scrollbar-thumb { background: var(--color-accent-dim); }
</style>
```

- [ ] **Step 6: Write the main `src/routes/+page.svelte`**

```svelte
<script>
  import TitleCard from '$lib/components/TitleCard.svelte'
  import ChatStream from '$lib/components/ChatStream.svelte'
  import CommandInput from '$lib/components/CommandInput.svelte'
  import { createParser } from '$lib/parser/streamParser.js'
  import { sendToTaskmaster, TASKMASTER_SYSTEM_PROMPT } from '$lib/api/taskmaster.js'
  import { sessionStore } from '$lib/stores/session.js'
  import { handleSlashCommand, isSlashCommand } from '$lib/commands/router.js'

  let blocks = []
  let inputEl
  let streaming = false

  function addBlock(block) {
    blocks = [...blocks, block]
  }

  async function handleSubmit(e) {
    const value = e.detail.value
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
<CommandInput on:submit={handleSubmit} bind:this={inputEl} />
```

- [ ] **Step 7: Verify layout renders**

```bash
npm run dev
```

Expected: Browser shows black terminal-style screen with "CARNIVAL" title, empty chat area, and `>>` input. No errors in console. Typing a slash command shows the stub "Command stub: /..." system message.

- [ ] **Step 8: Commit**

```bash
git add src/ static/
git commit -m "feat: add layout components, static asset placeholders, and main page skeleton"
```

---

## Chunk 7: Slash Command Router & File API Routes

### Task 9: Slash Command Router (replaces stub from Task 8)

**Files:**
- Replace: `src/lib/commands/router.js` (stub → full implementation)
- Create: `src/lib/commands/router.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/lib/commands/router.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { isSlashCommand, parseCommand } from './router.js'

describe('isSlashCommand', () => {
  it('returns true for slash-prefixed input', () => {
    expect(isSlashCommand('/start')).toBe(true)
    expect(isSlashCommand('/inbox')).toBe(true)
  })
  it('returns false for natural language', () => {
    expect(isSlashCommand('I attack the wolf')).toBe(false)
    expect(isSlashCommand('')).toBe(false)
  })
})

describe('parseCommand', () => {
  it('splits command from args', () => {
    expect(parseCommand('/add Buy milk @errands')).toEqual({ cmd: 'add', args: 'Buy milk @errands' })
  })
  it('handles commands with no args', () => {
    expect(parseCommand('/start')).toEqual({ cmd: 'start', args: '' })
  })
  it('handles /complete N', () => {
    expect(parseCommand('/complete 3')).toEqual({ cmd: 'complete', args: '3' })
  })
})
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
npx vitest run src/lib/commands/router.test.js
```

Expected: Cannot find module.

- [ ] **Step 3: Create `src/lib/commands/router.js`**

```js
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
      return handleAdd(args, addBlock, sessionStore)
    case 'complete':
      return handleComplete(args, addBlock, sessionStore)
    case 'stats':
      return handleStats(addBlock)
    case 'scene':
      return relayToTaskmaster(`Describe the current scene and atmosphere.`, addBlock, sessionStore)
    case 'next':
      return relayToTaskmaster(`Present my next challenges.`, addBlock, sessionStore)
    case 'story':
      return relayToTaskmaster(`Summarize the story so far.`, addBlock, sessionStore)
    case 'restart':
      sessionStore.clear()
      addBlock({ type: 'SYSTEM', data: { type: 'confirm', message: 'Session cleared. Type /start to begin.' } })
      break
    default:
      addBlock({ type: 'SYSTEM', data: { type: 'error', message: `Unknown command: /${cmd}` } })
  }
}

async function relayToTaskmaster(message, addBlock, sessionStore) {
  sessionStore.addMessage({ role: 'user', content: message })
  const parser = createParser(addBlock)
  let assistantText = ''
  await sendToTaskmaster(
    sessionStore.messages ?? [],
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
    const character = charRes.ok ? await charRes.text() : ''
    const aOnly = todo.split('\n').filter(l => l.startsWith('(A)') || l.trim() === '').join('\n')
    const initMessage = `Initialize the game session. Here is my character data:\n\n${character}\n\nHere are my current A-priority tasks:\n\n${aOnly}\n\nBegin the session with [STATS], [SCENE], then prose intro, then [TASKLIST].`
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

async function handleAdd(task, addBlock, sessionStore) {
  try {
    await fetch('/api/files/todo', { method: 'POST', body: JSON.stringify({ action: 'add', task }) })
    addBlock({ type: 'SYSTEM', data: { type: 'confirm', message: `Task added: ${task}` } })
  } catch {
    addBlock({ type: 'SYSTEM', data: { type: 'error', message: 'Failed to add task' } })
  }
}

async function handleComplete(n, addBlock, sessionStore) {
  try {
    await fetch('/api/files/todo', { method: 'POST', body: JSON.stringify({ action: 'complete', n: parseInt(n) }) })
    await relayToTaskmaster(`I just completed task #${n}. Resolve the encounter.`, addBlock, sessionStore)
  } catch {
    addBlock({ type: 'SYSTEM', data: { type: 'error', message: 'Failed to complete task' } })
  }
}

function handleStats(addBlock) {
  const data = get(character)
  if (!data) {
    addBlock({ type: 'SYSTEM', data: { type: 'warning', message: 'No character data loaded. Use /start first.' } })
    return
  }
  addBlock({ type: 'STATS', data })
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/lib/commands/router.test.js
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/commands/
git commit -m "feat: add slash command router with all Taskcraft commands"
```

---

### Task 10: File API Server Routes

**Files:**
- Create: `src/routes/api/files/todo/+server.js`
- Create: `src/routes/api/files/character/+server.js`

These routes proxy file I/O from the browser to the Node.js filesystem. The paths come from environment variables.

- [ ] **Step 1: Add path variables to `.env.example`**

```
VITE_ANTHROPIC_API_KEY=your_key_here
TODO_TXT_PATH=/Users/yourname/iCloudDrive/todo/todo.txt
CHARACTER_YAML_PATH=/Users/yourname/Development/carnival/data/character.yaml
```

- [ ] **Step 2: Create `src/routes/api/files/todo/+server.js`**

```js
import { readFileSync, writeFileSync } from 'fs'
import { json, error } from '@sveltejs/kit'

const TODO_PATH = process.env.TODO_TXT_PATH

export function GET() {
  if (!TODO_PATH) throw error(500, 'TODO_TXT_PATH not configured')
  try {
    const content = readFileSync(TODO_PATH, 'utf8')
    return new Response(content, { headers: { 'Content-Type': 'text/plain' } })
  } catch (e) {
    throw error(500, `Cannot read todo.txt: ${e.message}`)
  }
}

export async function POST({ request }) {
  if (!TODO_PATH) throw error(500, 'TODO_TXT_PATH not configured')
  const { action, task, n } = await request.json()

  try {
    let lines = readFileSync(TODO_PATH, 'utf8').split('\n')

    if (action === 'add') {
      lines.push(task)
    } else if (action === 'complete') {
      // Move nth uncompleted task to done
      let uncompleted = lines.filter(l => l.trim() && !l.startsWith('x '))
      const target = uncompleted[n - 1]
      if (target) {
        const idx = lines.indexOf(target)
        lines[idx] = `x ${new Date().toISOString().slice(0, 10)} ${target}`
      }
    }

    writeFileSync(TODO_PATH, lines.join('\n'))
    return json({ ok: true })
  } catch (e) {
    throw error(500, `Cannot write todo.txt: ${e.message}`)
  }
}
```

- [ ] **Step 3: Create `src/routes/api/files/character/+server.js`**

```js
import { readFileSync } from 'fs'
import { error } from '@sveltejs/kit'

const CHAR_PATH = process.env.CHARACTER_YAML_PATH

export function GET() {
  if (!CHAR_PATH) throw error(500, 'CHARACTER_YAML_PATH not configured')
  try {
    const content = readFileSync(CHAR_PATH, 'utf8')
    return new Response(content, { headers: { 'Content-Type': 'text/plain' } })
  } catch (e) {
    throw error(500, `Cannot read character.yaml: ${e.message}`)
  }
}
```

- [ ] **Step 4: Create a sample `data/character.yaml`**

```bash
mkdir -p data
cat > data/character.yaml << 'EOF'
name: Kasandra
class: Druid
level: 2
title: Apprentice Ranger
hp: 14
hp_max: 14
mp: 10
mp_max: 10
xp: 1830
xp_next: 670
attributes:
  strength: 18
  intelligence: 13
  wisdom: 14
  dexterity: 10
  constitution: 12
  charisma: 11
equipment:
  - "+1 sword"
  - "golden chain mail armor"
EOF
```

- [ ] **Step 5: Copy `.env.example` to `.env` and configure**

```bash
cp .env.example .env
```

Edit `.env` — set `TODO_TXT_PATH` and `CHARACTER_YAML_PATH` to local paths.

- [ ] **Step 6: Test file routes manually**

```bash
npm run dev
```

Then in another terminal:

```bash
curl http://localhost:5173/api/files/character
```

Expected: Returns character.yaml content.

- [ ] **Step 7: Commit**

```bash
git add src/routes/api/ data/ .env.example
git commit -m "feat: add file API server routes for todo.txt and character.yaml"
```

---

## Chunk 8: Integration & Verification

### Task 11: End-to-End Integration Test

**Goal:** Verify the full flow works from `/start` command to rendered components.

- [ ] **Step 1: Create a `.env` with real API key and file paths**

Edit `.env`:
```
VITE_ANTHROPIC_API_KEY=<your real key>
TODO_TXT_PATH=/path/to/your/todo.txt
CHARACTER_YAML_PATH=/path/to/carnival/data/character.yaml
```

- [ ] **Step 2: Run the dev server**

```bash
npm run dev
```

Open browser to `http://localhost:5173`

- [ ] **Step 3: Verify initial load**

Expected:
- Black terminal background with CRT scanlines
- "CARNIVAL" header visible
- Empty chat area
- `>>` prompt focused

- [ ] **Step 4: Type `/start` and verify full initialization**

Expected response sequence:
1. `>> /start` echoed as prose
2. `[i] Loading character and tasks...` system message
3. `[STATS]` block renders with HP/XP bars and attribute bubbles
4. `[SCENE]` block renders with location and description
5. Prose intro from Taskmaster
6. `[TASKLIST]` block with A-priority tasks

- [ ] **Step 5: Test natural language input**

Type: `I want to attack the strongest task`

Expected: Taskmaster responds with prose and possibly an `[ENCOUNTER]` block.

- [ ] **Step 6: Test `/stats` command**

Expected: System message emitted with no API call.

- [ ] **Step 7: Test `/restart`**

Expected: Session cleared, prompt to `/start` again.

- [ ] **Step 8: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 9: Final commit and push**

```bash
git add -A
git commit -m "feat: complete Carnival MVP — streaming chat interface with Tag Protocol components"
git push origin main
```

---

## Reference: Component-to-Tag Mapping

| Tag | Component | Spec |
|-----|-----------|------|
| `[STATS]` | `StatsBlock.svelte` | Spec 1 §1 |
| `[TASKLIST]` | `TaskList.svelte` | Spec 1 §2 |
| `[ENCOUNTER]` | `Encounter.svelte` | Spec 1 §3 |
| `[DICEROLL]` | `DiceRoll.svelte` | Spec 1 §4 |
| `[AWARD]` | `Award.svelte` | Spec 1 §5 |
| `[SCENE]` | `Scene.svelte` | Spec 1 §6 |
| `[SYSTEM]` | `SystemMsg.svelte` | Spec 1 §7 |

## Reference: Slash Commands

| Command | Behavior |
|---------|----------|
| `/start` | Load files, send init to Taskmaster |
| `/inbox` | Load full todo.txt, show all tasks |
| `/complete N` | Mark task N done, trigger encounter resolution |
| `/add <task>` | Append task to todo.txt |
| `/stats` | Show current stats from store (no API) |
| `/scene` | Ask Taskmaster for scene description |
| `/next` | Ask Taskmaster for next challenges |
| `/story` | Ask Taskmaster to summarize story |
| `/restart` | Clear session, prompt for /start |
