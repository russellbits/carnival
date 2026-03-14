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
