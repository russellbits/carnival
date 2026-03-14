import TaskList from './TaskList.svelte'
export default { title: 'Blocks/TaskList', component: TaskList }

const tasks = [
  { id: 1, text: 'Rebuild content system', priority: 'A', points: 300, attribute: '🧠', contexts: ['@coding'], complete: false },
  { id: 2, text: 'Research vacation destinations', priority: 'B', points: 35, attribute: '🦉', contexts: ['@travel'], complete: true },
  { id: 3, text: 'Write quarterly report', priority: 'C', points: 150, attribute: '🌟', contexts: ['@work'], complete: false },
]

export const AllA = { args: { data: { label: 'Your challenges await...', tasks: tasks.filter(t => t.priority === 'A') } } }
export const Mixed = { args: { data: { label: 'All tasks', tasks } } }
export const SingleTask = { args: { data: { label: '', tasks: [tasks[0]] } } }
export const WithCompleted = { args: { data: { label: 'Progress', tasks } } }
