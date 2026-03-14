import { readFileSync, writeFileSync } from 'fs'
import { json, error } from '@sveltejs/kit'

const TODO_PATH = process.env.TODO_TXT_PATH

export function GET() {
  if (!TODO_PATH) throw error(500, 'TODO_TXT_PATH not configured')
  try {
    const content = readFileSync(TODO_PATH, 'utf8')
    return new Response(content, { headers: { 'Content-Type': 'text/plain' } })
  } catch (e) {
    throw error(500, `Cannot read todo.txt: ${e.message}`)
  }
}

export async function POST({ request }) {
  if (!TODO_PATH) throw error(500, 'TODO_TXT_PATH not configured')
  const { action, task, n } = await request.json()

  try {
    let lines = readFileSync(TODO_PATH, 'utf8').split('\n')

    if (action === 'add') {
      lines.push(task)
    } else if (action === 'complete') {
      const uncompleted = lines.filter(l => l.trim() && !l.startsWith('x '))
      const target = uncompleted[n - 1]
      if (target) {
        const idx = lines.indexOf(target)
        lines[idx] = `x ${new Date().toISOString().slice(0, 10)} ${target}`
      }
    }

    writeFileSync(TODO_PATH, lines.join('\n'))
    return json({ ok: true })
  } catch (e) {
    throw error(500, `Cannot write todo.txt: ${e.message}`)
  }
}
