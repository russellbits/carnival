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
