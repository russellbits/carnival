# Dubliner

> The name stems from "The Dubliners" from James Joyce; an infamously meandering narrartive.

Dubliner is a SvelteKit-based streaming chat interface for AI-powered text-based chats that calls components to be woven into the chat via templates that the AI provides.

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Storybook

Run Storybook to explore and develop components in isolation:

```bash
npm run storybook
```

### Building

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
src/
├── lib/
│   ├── api/           # API clients (Taskmaster/Claude)
│   ├── commands/      # Slash command router
│   ├── components/    # Svelte components
│   │   └── blocks/    # Tagged block components (Stats, TaskList, DiceRoll, etc.)
│   ├── parser/        # Stream parser for tagged components
│   └── stores/        # Svelte stores
├── routes/
│   └── api/           # Server endpoints
└── stories/          # Storybook stories
```

## Tag Protocol

Carnival uses a tag protocol to render structured components within the AI's text stream:

- `[STATS]` — Character stat block (HP, MP, XP, attributes)
- `[TASKLIST]` — Quest/task list with checkboxes
- `[DICEROLL]` — Dice roll results with animations
- `[ENCOUNTER]` — Boss/foe encounter display
- `[AWARD]` — XP/reward displays
- `[SCENE]` — Narrative scene breaks
- `[SYSTEM]` — System messages

## Tech Stack

- SvelteKit 2
- Svelte 5 (Runes)
- Vite
- Storybook
- Vitest + Playwright
