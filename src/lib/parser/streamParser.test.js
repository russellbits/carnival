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
