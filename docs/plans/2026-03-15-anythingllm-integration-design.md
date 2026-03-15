# AnythingLLM Integration Design

**Date:** 2026-03-15

## Overview

Add the ability to use AnythingLLM as an alternative AI backend to Claude, with runtime switching via slash commands.

## Requirements

1. **Dual Backend Support** — User can switch between Claude and AnythingLLM at runtime
2. **Single Workspace** — Hardcoded workspace configured via environment variables
3. **Environment-Based Auth** — API key stored in `.env`
4. **Slash Command Switching** — `/use-claude` and `/use-anythingllm` commands

## Architecture

### New Files

1. `src/routes/api/anythingllm/+server.js` — Proxies to AnythingLLM chat API

### Modified Files

1. `.env.example` — Add AnythingLLM configuration
2. `src/lib/api/taskmaster.js` — Add backend selection logic
3. `src/lib/commands/router.js` — Add backend switching commands
4. `src/lib/stores/session.js` — Store current backend preference

### Environment Variables

```
ANYTHING_LLM_API_KEY=your_api_key
ANYTHING_LLM_URL=http://localhost:3001
ANYTHING_LLM_WORKSPACE=your-workspace-slug
```

## API Integration

### AnythingLLM Chat API

**Endpoint:** `POST /api/chat`

**Request:**
```json
{
  "workspaceSlug": "your-workspace-slug",
  "message": "user message",
  "mode": "chat"
}
```

**Response:** JSON with `response` field containing the assistant message.

## Backend Switching

1. Default backend: Claude (existing behavior)
2. Slash commands modify the active backend in session store
3. All subsequent chat requests use the selected backend
4. Show a system message confirming the switch

## Testing Strategy

1. Test `/api/claude` still works (existing)
2. Test `/api/anythingllm` returns valid response
3. Test slash commands switch backend correctly
4. Test messages route to correct backend
