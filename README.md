# Carnival

Carnival is a SvelteKit-based streaming chat interface for **Taskcraft** — an AI-powered text-based RPG productivity game. It renders tagged components from the Claude API into interactive RPG-style UI elements.

## What is Taskcraft?

Taskcraft transforms your daily tasks and productivity into an adventure. Instead of a boring todo list, you embark on quests, level up your character, earn XP, and face encounters as you complete your work. The AI (Taskmaster) narrates your progress as an immersive RPG story.

### Features

- **Streaming Chat Interface** — Real-time AI responses with animated text rendering
- **Tagged Component System** — Special tags in AI responses render as interactive UI components (stats, task lists, dice rolls, encounters, awards)
- **Slash Commands** — Use `/start`, `/stats`, `/tasks`, `/roll`, `/encounter`, and more
- **Character Progression** — Track HP, MP, XP, level, and attributes
- **Storybook** — Component-driven development with Storybook

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
