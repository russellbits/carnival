// Stub — full implementation in Task 9
export function isSlashCommand(input) {
  return typeof input === 'string' && input.startsWith('/')
}
export async function handleSlashCommand(input, addBlock) {
  addBlock({ type: 'SYSTEM', data: { type: 'info', message: `Command stub: ${input}` } })
}
