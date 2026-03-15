import { env } from '$env/dynamic/private'
import { error, json } from '@sveltejs/kit'

export async function POST({ request }) {
  const apiKey = env.ANTHROPIC_API_KEY
  if (!apiKey) throw error(500, 'ANTHROPIC_API_KEY not configured')

  let body
  try {
    body = await request.json()
  } catch (e) {
    throw error(400, `Bad request body: ${e.message}`)
  }

  let upstream
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })
  } catch (e) {
    throw error(502, `Cannot reach Anthropic API: ${e.message}`)
  }

  if (!upstream.ok) {
    const text = await upstream.text()
    throw error(upstream.status, `Anthropic error ${upstream.status}: ${text}`)
  }

  return new Response(upstream.body, {
    headers: { 'Content-Type': 'text/event-stream' },
  })
}
