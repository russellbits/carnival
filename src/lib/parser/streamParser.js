/**
 * Stream parser for the Tag Protocol.
 * Processes a text stream and emits typed block objects.
 * @param {function} onBlock - Called with each complete block
 * @returns {function} write - Call with each text chunk; call with null to flush
 */
export function createParser(onBlock) {
  const KNOWN_TAGS = ['STATS', 'TASKLIST', 'ENCOUNTER', 'DICEROLL', 'AWARD', 'SCENE', 'SYSTEM']

  let buffer = ''
  let mode = 'PROSE' // PROSE | TAG_BODY
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
        const partialTagMatch = afterBracket.match(/^([A-Z]*)/)
        const partialName = partialTagMatch ? partialTagMatch[1] : ''

        // Check if partialName could be a prefix of any known tag
        const couldBeKnown = KNOWN_TAGS.some(t => t.startsWith(partialName))

        if (!couldBeKnown) {
          // Not a known tag — consume up to and including '[' as prose
          proseBuffer += buffer.slice(0, bracketIdx + 1)
          buffer = buffer.slice(bracketIdx + 1)
          continue
        }

        // Might be a tag — check if we have the full tag opener (name + closer/attrs)
        const openTagMatch = buffer.slice(bracketIdx).match(/^\[([A-Z]+)([^\]]*?)(\/\]|\])/)
        if (!openTagMatch) {
          // Incomplete tag opener — wait for more data
          proseBuffer += buffer.slice(0, bracketIdx)
          buffer = buffer.slice(bracketIdx)
          break
        }
        const [fullMatch, tagName, attrPart, closer] = openTagMatch
        if (!KNOWN_TAGS.includes(tagName)) {
          // Full tag name resolved and it's not known — emit as prose
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
