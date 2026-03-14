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
