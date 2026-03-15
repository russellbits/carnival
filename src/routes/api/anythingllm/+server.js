import { env } from '$env/dynamic/private'
import { error } from '@sveltejs/kit'

export async function POST({ request }) {
  const apiKey = env.ANYTHING_LLM_API_KEY
  const baseUrl = env.ANYTHING_LLM_URL || 'http://localhost:3001'
  const workspace = env.ANYTHING_LLM_WORKSPACE

  if (!apiKey) {
    throw error(500, 'ANYTHING_LLM_API_KEY not configured')
  }
  if (!workspace) {
    throw error(500, 'ANYTHING_LLM_WORKSPACE not configured')
  }

  let body
  try {
    body = await request.json()
  } catch (e) {
    throw error(400, `Bad request body: ${e.message}`)
  }

  const userMessage = body.messages?.[body.messages.length - 1]?.content || ''

  try {
    const upstream = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        workspaceSlug: workspace,
        message: userMessage,
        mode: 'chat',
      }),
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      throw error(upstream.status, `AnythingLLM error ${upstream.status}: ${text}`)
    }

    const data = await upstream.json()
    return new Response(data.response || '', {
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch (e) {
    if (e.status) throw e
    throw error(502, `Cannot reach AnythingLLM: ${e.message}`)
  }
}
