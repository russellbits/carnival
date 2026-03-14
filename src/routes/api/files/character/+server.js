import { readFileSync } from 'fs'
import { error } from '@sveltejs/kit'

const CHAR_PATH = process.env.CHARACTER_YAML_PATH

export function GET() {
  if (!CHAR_PATH) throw error(500, 'CHARACTER_YAML_PATH not configured')
  try {
    const content = readFileSync(CHAR_PATH, 'utf8')
    return new Response(content, { headers: { 'Content-Type': 'text/plain' } })
  } catch (e) {
    throw error(500, `Cannot read character.yaml: ${e.message}`)
  }
}
