import { readFileSync } from 'fs'
import { error } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'

export function GET() {
  const path = env.CHARACTER_YAML_PATH
  if (!path) throw error(500, 'CHARACTER_YAML_PATH not configured')
  try {
    const content = readFileSync(path, 'utf8')
    return new Response(content, { headers: { 'Content-Type': 'text/plain' } })
  } catch (e) {
    throw error(500, `Cannot read character.yaml: ${e.message}`)
  }
}
