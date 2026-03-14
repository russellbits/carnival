import SystemMsg from './SystemMsg.svelte'
export default { title: 'Blocks/SystemMsg', component: SystemMsg }
export const Confirm = { args: { data: { type: 'confirm', message: 'Task #3 marked complete. done.txt updated.' } } }
export const Error = { args: { data: { type: 'error', message: 'Failed to read todo.txt.' } } }
export const Warning = { args: { data: { type: 'warning', message: 'API key not set.' } } }
export const Info = { args: { data: { type: 'info', message: 'Session initialized.' } } }
