import Encounter from './Encounter.svelte'
export default { title: 'Blocks/Encounter', component: Encounter }

export const Combat = { args: { data: { title: 'Wolves!', description: 'Five wolves pour out of the frozen woods.', attribute: 'strength', stakes: 'You must act with code and attack the largest one!' }, attrs: { type: 'combat', difficulty: 'B' } } }
export const Puzzle = { args: { data: { title: 'The Sealed Door', description: 'Ancient runes glow faintly on a stone door.', attribute: 'intelligence', stakes: 'Decipher the runes to proceed.' }, attrs: { type: 'puzzle', difficulty: 'C' } } }
export const Social = { args: { data: { title: 'The Merchant', description: 'A cloaked merchant offers information — for a price.', attribute: 'charisma', stakes: 'Negotiate the terms.' }, attrs: { type: 'social', difficulty: 'D' } } }
export const Obstacle = { args: { data: { title: 'Flooded Path', description: 'The river runs high and cold after three days of rain.', attribute: 'constitution', stakes: 'Push through or find another way.' }, attrs: { type: 'obstacle', difficulty: 'B' } } }
export const Discovery = { args: { data: { title: 'Hidden Cache', description: 'Behind a loose stone in the wall, a hollow space.', attribute: 'wisdom', stakes: '' }, attrs: { type: 'discovery', difficulty: 'A' } } }
