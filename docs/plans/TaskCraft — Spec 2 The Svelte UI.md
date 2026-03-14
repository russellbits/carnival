# TaskCraft — Spec 2: The Svelte UI
**Version**: 0.1.0  
**Status**: Draft  
**Depends on**: Spec 1 (Tag Protocol)

---

## Purpose

The Svelte UI is the player's window into the game. It is a streaming chat interface that renders the Taskmaster's tagged text stream into a mix of narrative prose and interactive components. It handles both slash command input and natural language gameplay. For MVP it runs locally on the Mac Mini.

---

## Technology Stack

| Concern | Choice | Notes |
|---------|--------|-------|
| Framework | SvelteKit | File-based routing, SSR optional |
| Styling | CSS custom properties | Theme system, no Tailwind |
| Streaming | `fetch` with `ReadableStream` | Direct Claude API streaming |
| State | Svelte stores | Character, session, theme state |
| Build | Vite | SvelteKit default |
| Runtime | Node.js (local) | `npm run dev` for MVP |

No UI component library. All components are bespoke to maintain theme fidelity.

---

## Project Structure

```
taskcraft/
├── src/
│   ├── routes/
│   │   └── +page.svelte          # Main game screen
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ChatStream.svelte      # The scrolling narrative area
│   │   │   ├── CommandInput.svelte    # The >> prompt
│   │   │   ├── TitleCard.svelte       # Static opening title image/logo
│   │   │   └── blocks/
│   │   │       ├── Prose.svelte       # Plain narrative text
│   │   │       ├── StatsBlock.svelte  # [STATS] component
│   │   │       ├── TaskList.svelte    # [TASKLIST] component
│   │   │       ├── Encounter.svelte   # [ENCOUNTER] component
│   │   │       ├── DiceRoll.svelte    # [DICEROLL] component
│   │   │       ├── Award.svelte       # [AWARD] component
│   │   │       ├── Scene.svelte       # [SCENE] component
│   │   │       └── SystemMsg.svelte   # [SYSTEM] component
│   │   ├── parser/
│   │   │   └── streamParser.js        # Tag detection and routing
│   │   ├── stores/
│   │   │   ├── session.js             # Conversation history
│   │   │   ├── character.js           # Character state (derived from STATS tags)
│   │   │   └── theme.js               # Active theme
│   │   ├── api/
│   │   │   └── taskmaster.js          # Claude API call + stream handler
│   │   └── themes/
│   │       └── zork.css               # Zork theme variable definitions
│   ├── app.css                        # Base styles, imports active theme
│   └── app.html                       # Shell
├── static/
│   assets/
│   │   ├── title.png                  # TASKCRAFT opening title
│   │   ├── portrait.png               # Character portrait
│   │   └── dice.png                   # Dice face image for DiceRoll component
├── .env                               # ANTHROPIC_API_KEY, todo.txt path
└── package.json
```

---

## Theme System

### CSS Variable Contract

Every component must use only these variables — no hardcoded colors, fonts, or sizing. This is the complete variable set all themes must define:

```css
/* Color */
--color-bg               /* Page background */
--color-bg-surface       /* Component/card background */
--color-bg-input         /* Input field background */
--color-text             /* Primary narrative text */
--color-text-dim         /* Secondary/metadata text */
--color-text-inverse     /* Text on accent backgrounds */
--color-accent           /* Primary accent (borders, highlights) */
--color-accent-dim       /* Muted accent */
--color-success          /* Positive outcomes */
--color-danger           /* Negative outcomes, damage */
--color-warning          /* Caution states */
--color-system           /* System message text */

/* Typography */
--font-mono              /* Monospace — narrative, input, code */
--font-display           /* Display — titles, headers */
--font-size-base         /* Base prose size */
--font-size-sm           /* Small/metadata */
--font-size-lg           /* Encounter titles, headers */
--font-size-xl           /* Major headings */
--line-height-prose      /* Narrative text line height */

/* Spacing */
--space-xs               /* 4px equivalent */
--space-sm               /* 8px equivalent */
--space-md               /* 16px equivalent */
--space-lg               /* 32px equivalent */
--space-xl               /* 64px equivalent */

/* Borders & Decoration */
--border-width
--border-style
--border-radius          /* 0 for Zork — no rounded corners */
--border-color

/* Animation */
--cursor-blink-rate      /* Text cursor blink speed */
--text-appear-speed      /* Per-character stream speed */
--scanline-opacity       /* CRT scanline overlay intensity */
```

### Zork Theme (`src/lib/themes/zork.css`)

```css
[data-theme="zork"] {
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

  --font-mono:            "Courier New", "Lucida Console", monospace;
  --font-display:         "Courier New", monospace;
  --font-size-base:       16px;
  --font-size-sm:         13px;
  --font-size-lg:         20px;
  --font-size-xl:         28px;
  --line-height-prose:    1.7;

  --space-xs:             4px;
  --space-sm:             8px;
  --space-md:             16px;
  --space-lg:             32px;
  --space-xl:             64px;

  --border-width:         1px;
  --border-style:         solid;
  --border-radius:        0;
  --border-color:         #00ff41;

  --cursor-blink-rate:    0.8s;
  --text-appear-speed:    12ms;
  --scanline-opacity:     0.03;
}
```

The Zork theme also applies a global CRT scanline overlay via a `::before` pseudo-element on the body — repeating horizontal lines at very low opacity to simulate phosphor screen texture.

---

## Layout

The page is a single full-viewport layout with three vertical regions:

```
┌─────────────────────────────┐
│  TitleCard (static, top)    │  Fixed height, shows TASKCRAFT logo
├─────────────────────────────┤
│                             │
│  ChatStream (scrolling)     │  flex-grow: 1, overflow-y: auto
│                             │  Narrative + components stream here
│                             │
├─────────────────────────────┤
│  CommandInput (fixed bottom)│  Always visible, >> prompt
└─────────────────────────────┘
```

The ChatStream auto-scrolls to bottom as new content arrives. No sidebar. No nav. The entire screen is the game.

---

## Stream Parser (`src/lib/parser/streamParser.js`)

The parser processes the raw text stream from Claude and emits a sequence of **blocks** — typed objects that the ChatStream renders as either prose or components.

### Block Types

```js
// Prose block
{ type: 'prose', text: 'You step into the darkened corridor...' }

// Component block
{ type: 'STATS', data: { hp: 14, xp: 1830, ... } }
{ type: 'TASKLIST', data: { tasks: [...] } }
{ type: 'ENCOUNTER', data: { title: 'Wolves!', ... }, attrs: { type: 'combat', difficulty: 'B' } }
{ type: 'DICEROLL', data: { dice: '1d20', result: 14, ... } }
{ type: 'AWARD', data: { xp: 300, ... } }
{ type: 'SCENE', data: { location: '...', description: '...' } }
{ type: 'SYSTEM', data: { type: 'confirm', message: '...' } }
```

### Parser State Machine

The parser maintains state as it processes the incoming stream:

```
PROSE mode (default)
  → encounters "[" + uppercase letters → enter TAG_OPEN mode
  → accumulate text → emit prose block on tag open or stream end

TAG_OPEN mode
  → accumulate tag name and attributes
  → if self-closing ("/]") → parse, emit component block, return to PROSE
  → if ">" or "]" → enter TAG_BODY mode

TAG_BODY mode
  → accumulate everything until matching "[/TAGNAME]"
  → parse JSON body
  → emit component block
  → return to PROSE mode

FALLBACK
  → if JSON parse fails → emit content as prose block
  → log malformed tag to console
```

### API

```js
// streamParser.js
export function createParser(onBlock) {
  // Returns a writable function
  // Call with each chunk of text from the stream
  // onBlock(block) is called each time a complete block is ready
  return function write(chunk) { ... }
}
```

Usage in `taskmaster.js`:
```js
const parser = createParser((block) => {
  blocks.update(b => [...b, block])
})

for await (const chunk of stream) {
  parser(chunk)
}
```

---

## Components

### ChatStream.svelte

Maintains the `blocks` array. Iterates and renders each block through a component switcher:

```svelte
{#each blocks as block}
  {#if block.type === 'prose'}
    <Prose text={block.text} />
  {:else if block.type === 'STATS'}
    <StatsBlock data={block.data} />
  {:else if block.type === 'ENCOUNTER'}
    <Encounter data={block.data} attrs={block.attrs} />
  <!-- etc. -->
  {/if}
{/each}
```

New blocks are appended; old blocks are never re-rendered. The stream is append-only.

### CommandInput.svelte

The `>>` prompt at the bottom. Handles:

- **Enter** → submit input
- **Up/Down arrows** → command history navigation (last 50 entries)
- Slash command detection: if input starts with `/`, route as command; otherwise route as natural language

```svelte
<div class="input-row">
  <span class="prompt">&gt;&gt;</span>
  <input
    bind:value={input}
    on:keydown={handleKey}
    autocomplete="off"
    spellcheck="false"
  />
</div>
```

The input is always focused. Clicking anywhere on the ChatStream refocuses the input. This preserves the terminal feel.

### Prose.svelte

Renders plain text. In the Zork theme, text appears character by character using a CSS animation driven by a small JS typewriter effect — but this is opt-in per block (streaming prose types in; injected prose like scene descriptions can appear instantly or type in depending on context).

### StatsBlock.svelte

Renders the attribute row seen at the top of the image: six attribute bubbles with emoji + score, HP bar, XP bar, level/title. This component also writes to the `character` store so other components can read current stats.

### TaskList.svelte

Renders tasks as a numbered list with priority indicators and attribute emoji. Completed tasks show strikethrough. There are no checkboxes — this is a CLI-style numbered list. Completion is done via natural language ("I finished the second task") or `/complete N`. The numbered format is intentional: it reinforces the terminal aesthetic and keeps interaction in the command line where it belongs.

### Encounter.svelte

Bordered box component. Title in `--font-size-xl`, description in prose style. The `type` attribute sets a modifier class that can adjust border color (`combat` → `--color-danger`, `discovery` → `--color-accent`, etc.).

### DiceRoll.svelte

Shows the static `dice.png` asset, the dice notation, the raw result, modifier, total, and outcome label. Outcome colors: success → `--color-success`, failure → `--color-danger`, critical variants get additional visual treatment (all-caps label, slightly larger total).

### Award.svelte

Brief celebratory block. XP number in large type, attribute gain noted below, optional gold amount, flavor message. Appears and then the STATS block that follows it shows the updated totals.

### Scene.svelte

Full-width atmospheric block. Location name as header, description in slightly dimmed text to differentiate from active encounter prose.

### SystemMsg.svelte

Minimal. Dimmed text, prefixed with type indicator:
- `[OK]` for confirm
- `[ERR]` for error  
- `[!]` for warning
- `[i]` for info

---

## API Layer (`src/lib/api/taskmaster.js`)

Handles communication with the Claude API. For MVP this is a direct call from the browser using the API key stored in `.env` (acceptable for local-only MVP; would move server-side for production).

### Request format

```js
export async function sendToTaskmaster(messages, onChunk) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      stream: true,
      system: TASKMASTER_SYSTEM_PROMPT,
      messages,
    })
  })

  // Handle SSE stream
  const reader = response.body.getReader()
  // ... decode chunks, call onChunk(text) for each text delta
}
```

### Session management (`src/lib/stores/session.js`)

The full conversation history is maintained in a Svelte store and passed with every request. Claude has no memory between calls — the store is the memory.

```js
// session store shape
{
  messages: [
    { role: 'user', content: '...' },
    { role: 'assistant', content: '...' },
    // ...
  ],
  initialized: false
}
```

On `/start` or first load, an initialization message is sent that includes the current character.yaml and todo.txt contents embedded in the user message. This grounds the Taskmaster in the current game state.

---

## Slash Command Routing

Slash commands are intercepted before reaching the Taskmaster. A local command router handles them and may:

1. Perform a local operation and emit a `[SYSTEM]` block directly (no API call)
2. Format a structured message and send to the Taskmaster for narrative wrapping
3. Read/write the todo.txt file via the MCP server

| Command | Behavior |
|---------|----------|
| `/start` | Initialize session, load character + todo, send init message to Taskmaster |
| `/inbox` | Load full todo.txt, send to Taskmaster to present as `[TASKLIST]` — shows all priorities, not just A |
| `/complete N` | Mark task N complete via MCP, send result to Taskmaster for encounter |
| `/add <task>` | Add task via MCP, confirm with `[SYSTEM]` |
| `/stats` | Emit current `[STATS]` block from store (no API call) |
| `/scene` | Ask Taskmaster to describe current location |
| `/next` | Ask Taskmaster to present next challenges |
| `/story` | Ask Taskmaster to summarize story so far |
| `/restart` | Clear session store, re-initialize |

---

## Initialization Flow

```
1. Player loads the app
2. TitleCard renders (static TASKCRAFT logo)
3. ChatStream is empty — shows blinking cursor
4. Player types /start (or it auto-triggers on load)
5. App reads todo.txt from iCloud path (via MCP or direct file read)
6. App reads character.yaml from local path
7. Only A-priority tasks are filtered from todo.txt and passed to the Taskmaster
   - This keeps context lean and makes init feel like "your most urgent quests"
   - The full todo.txt is never loaded at init — only the A-priority subset
   - Promoting a task to A-priority is the player's act of bringing it into the game
8. Taskmaster receives initialization, emits:
   - [STATS] block
   - [SCENE] block (opening location)
   - Prose (prologue/welcome)
   - [TASKLIST] block (first challenges)
9. Player is in the game
```

---

## File Access (MVP)

For MVP, todo.txt and character.yaml live on iCloud Drive. The app reads them via absolute path using a SvelteKit server route (not directly from the browser — Node.js can read the filesystem).

```
/api/files/todo     GET → returns todo.txt content
/api/files/todo     POST → writes updated todo.txt content
/api/files/character GET → returns character.yaml content
/api/files/character POST → writes updated character.yaml
```

These server routes are simple file read/write operations. The MCP server will eventually own this responsibility — for MVP these thin routes suffice.

---

## Static Assets

```
static/assets/
├── title.png       # TASKCRAFT title graphic (green on black, retro pixel or carved wood style)
├── portrait.png    # Player character portrait (placeholder initially)
└── dice.png        # Dice face image used in DiceRoll component
```

Assets are referenced directly. No asset pipeline complexity for MVP.

---

## Storybook

Storybook is included for visual component development and testing. Each block component has a co-located `.stories.js` file. This allows individual components to be developed, tested, and documented with varied JSON payloads entirely outside the chat session and API.

### Setup

```
@storybook/svelte-vite  # Storybook with Vite + Svelte
```

Run with `npm run storybook`. Stories live alongside their components:

```
blocks/
├── Encounter.svelte
├── Encounter.stories.js
├── DiceRoll.svelte
├── DiceRoll.stories.js
├── StatsBlock.svelte
├── StatsBlock.stories.js
└── ...
```

### Story Convention

Each stories file exports a default meta block and named story variants:

```js
// DiceRoll.stories.js
import DiceRoll from './DiceRoll.svelte'

export default {
  title: 'Blocks/DiceRoll',
  component: DiceRoll,
}

export const Success = {
  args: {
    data: {
      dice: '1d20', modifier: 2, result: 18,
      total: 20, dc: 13, outcome: 'critical_success',
      label: 'Attack Roll'
    }
  }
}

export const Failure = {
  args: {
    data: {
      dice: '1d20', modifier: 2, result: 3,
      total: 5, dc: 13, outcome: 'failure',
      label: 'Attack Roll'
    }
  }
}

export const SavingThrow = {
  args: {
    data: {
      dice: '1d20', modifier: -1, result: 9,
      total: 8, dc: 10, outcome: 'failure',
      label: 'Constitution Save'
    }
  }
}
```

### Required Story Variants per Component

| Component | Story Variants |
|-----------|---------------|
| StatsBlock | LowHP, FullHP, LevelUp, HighXP |
| TaskList | AllA, Mixed priorities, SingleTask, WithCompleted |
| Encounter | Combat, Puzzle, Social, Obstacle, Discovery |
| DiceRoll | CriticalSuccess, Success, Failure, CriticalFailure, NoModifier |
| Award | XPOnly, XPandGold, AttributeGain, LargeReward |
| Scene | Ominous, Neutral, Welcoming |
| SystemMsg | Confirm, Error, Warning, Info |

Storybook also serves as living documentation of the component registry defined in Spec 1 — the source of truth for what each component expects as input.

---

- API key moves to server-side SvelteKit `+server.js` routes
- File access moves to Supabase Storage buckets
- Auth via Supabase
- Theme selection persisted to user profile
- LAMP hosting: `npm run build` → static files served by Apache
- PHP middleware layer replaces SvelteKit server routes for API calls

---

*End of Spec 2*