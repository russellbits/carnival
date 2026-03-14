# TaskCraft — Spec 1: The Tag Protocol
**Version**: 0.1.0  
**Status**: Draft  
**Depends on**: Nothing (this is the contract all other specs reference)

---

## Purpose

The Tag Protocol is the shared language between the Taskmaster skill and the Svelte UI. It defines how the Taskmaster embeds structured component directives inside a natural language stream, and how the UI parser identifies and hydrates them into rendered components.

All other specs (Svelte UI, taskmaster.skill, MCP server) treat this document as canonical.

---

## Core Principle

The Taskmaster emits a single text stream. That stream is a mix of:

1. **Prose** — plain narrative text, rendered as-is in the terminal style
2. **Tagged blocks** — structured directives that the UI intercepts and renders as components

Tagged blocks are invisible seams in the narrative. The player sees a rendered component where the tag was; they never see the raw tag syntax.

---

## Tag Syntax

### Basic Format

```
[TAGNAME]
...content...
[/TAGNAME]
```

### With Attributes

```
[TAGNAME attr="value" attr2="value2"]
...content...
[/TAGNAME]
```

### Self-Closing (for simple payloads)

```
[TAGNAME data="..."/]
```

### Rules

- Tag names are **UPPERCASE**
- Attributes use double-quoted strings
- Content between tags is **JSON** unless otherwise specified per component
- Tags may appear anywhere in the prose stream — before, after, or between paragraphs
- Multiple tags of the same type may appear in a single response
- Tags must not be nested inside other tags
- Malformed tags fall through as raw text (fail gracefully)

---

## Initial Component Registry

### 1. `[STATS]` — Character Stat Block

Renders the HP/XP/attribute bar. Typically emitted at session start or after XP changes.

```
[STATS]
{
  "hp": 14,
  "hp_max": 14,
  "mp": 10,
  "mp_max": 10,
  "xp": 1830,
  "xp_next": 670,
  "level": 2,
  "title": "Apprentice Ranger",
  "attributes": {
    "strength":     { "score": 18, "emoji": "💪" },
    "intelligence": { "score": 13, "emoji": "🧠" },
    "wisdom":       { "score": 14, "emoji": "🦉" },
    "dexterity":    { "score": 10, "emoji": "🤹" },
    "constitution": { "score": 12, "emoji": "❤️" },
    "charisma":     { "score": 11, "emoji": "🌟" }
  }
}
[/STATS]
```

**Trigger conditions**: Session start (`/start`), after any XP award, after HP change.

---

### 2. `[TASKLIST]` — Task Challenge Display

Renders a list of tasks as GM-presented challenges. Checkboxes reflect completion state.

```
[TASKLIST]
{
  "label": "Your challenges await...",
  "tasks": [
    {
      "id": 1,
      "text": "Rebuild content system deadline +ecommerce app +project",
      "priority": "A",
      "points": 300,
      "attribute": "🧠",
      "contexts": ["@coding"],
      "complete": false
    },
    {
      "id": 2,
      "text": "Research vacation destinations",
      "priority": "B",
      "points": 35,
      "attribute": "🦉",
      "contexts": ["@travel"],
      "complete": true
    }
  ]
}
[/TASKLIST]
```

**Trigger conditions**: `/inbox`, `/start`, when Taskmaster presents challenges.

---

### 3. `[ENCOUNTER]` — Narrative Encounter Block

Renders an encounter description with its own visual treatment — bordered box, slightly different text color or weight.

```
[ENCOUNTER type="combat" difficulty="B"]
{
  "title": "Wolves!",
  "description": "No sooner do you begin to make your way to the long-dead fire than five wolves pour out of the crisp and frozen woods. Their hate-torn eyes move ceaselessly; the largest one coolly tears one branch.",
  "attribute": "strength",
  "stakes": "You must act with code and attack the largest one!"
}
[/ENCOUNTER]
```

**Attributes**:
- `type`: `combat`, `puzzle`, `social`, `obstacle`, `discovery`, `endurance`
- `difficulty`: `A`–`E` matching todo.txt priority scale

**Trigger conditions**: Task completion, random encounter, scene description.

---

### 4. `[DICEROLL]` — Dice Roll Component

Renders the dice roll UI — static dice image, roll result, outcome label.

```
[DICEROLL]
{
  "dice": "1d20",
  "modifier": 2,
  "result": 14,
  "total": 16,
  "dc": 13,
  "outcome": "success",
  "label": "Attack Roll"
}
[/DICEROLL]
```

**Fields**:
- `dice`: standard notation (`1d20`, `2d6`, etc.)
- `modifier`: integer, positive or negative
- `result`: the raw die face result
- `total`: result + modifier
- `dc`: difficulty class being rolled against (omit if not applicable)
- `outcome`: `success`, `failure`, `critical_success`, `critical_failure`
- `label`: human-readable label for what was rolled

**Trigger conditions**: Any mechanical resolution — attacks, saves, skill checks.

---

### 5. `[AWARD]` — XP / Treasure Award

Renders a reward notification. Brief, celebratory.

```
[AWARD]
{
  "xp": 300,
  "attribute": "intelligence",
  "attribute_gain": 0.3,
  "gold": 0,
  "message": "The secret door yields its treasures to your keen mind."
}
[/AWARD]
```

**Trigger conditions**: Task completion, encounter resolution, achievement unlock.

---

### 6. `[SCENE]` — Location / Atmosphere Description

Renders an evocative location description. Distinct from encounter — no stakes, just atmosphere. Used when player asks where they are or the Taskmaster establishes a new location.

```
[SCENE]
{
  "location": "The Thornwood",
  "description": "You are Kasandra, an elven druid of the deep woods. You are a rare site among most woodland folk and are not comfortable at your workbench. But a long conversation you makes a promise, and you have many miles to fulfill it. You are carrying a +1 sword and wearing golden chain mail armor.",
  "mood": "ominous"
}
[/SCENE]
```

**Trigger conditions**: `/scene`, session start, location change.

---

### 7. `[SYSTEM]` — System Message

Renders a non-narrative system notification — task added, file saved, error, confirmation.

```
[SYSTEM]
{
  "type": "confirm",
  "message": "Task #3 marked complete. done.txt updated."
}
[/SYSTEM]
```

**Types**: `confirm`, `error`, `warning`, `info`

**Trigger conditions**: Slash command responses, file operations, MCP tool results.

---

## Parsing Rules for the Svelte UI

1. The UI streams text character by character (or chunk by chunk from the API)
2. When the parser encounters `[TAGNAME`, it enters **tag accumulation mode**
3. It continues accumulating until it finds the matching `[/TAGNAME]` or `[TAGNAME .../]`
4. The accumulated content is parsed as JSON and passed to the matching component
5. If JSON parsing fails, the raw tag text is emitted as prose (graceful degradation)
6. Prose between and around tags renders normally
7. The parser is **not** recursive — tags inside tag content are treated as literal text

---

## Extensibility

New component types are added by:

1. Defining the tag name and JSON schema here in this spec
2. Registering the component in the Svelte UI's component registry
3. Instructing the Taskmaster skill to emit the new tag under defined conditions
4. Optionally adding MCP tools to support the new mechanic

The MCP server, Taskmaster skill, and Svelte UI are all independently extensible as long as they honor this protocol.

---

## Future Component Candidates (not in MVP)

| Tag | Purpose |
|-----|---------|
| `[IMAGE]` | Dynamic encounter image from generation service |
| `[MAP]` | Spatial representation of current area |
| `[INVENTORY]` | Full inventory display |
| `[QUEST]` | Project/quest status card |
| `[LEVELUP]` | Level-up celebration sequence |
| `[THEME]` | Theme switch directive (Zork → Sci-fi, etc.) |

---

*End of Spec 1*