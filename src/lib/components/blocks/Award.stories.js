import Award from './Award.svelte'
export default { title: 'Blocks/Award', component: Award }
export const XPOnly = { args: { data: { xp: 300, attribute: '', attribute_gain: 0, gold: 0, message: '' } } }
export const XPandGold = { args: { data: { xp: 150, attribute: '', attribute_gain: 0, gold: 25, message: 'The merchant rewards your quick work.' } } }
export const AttributeGain = { args: { data: { xp: 300, attribute: 'intelligence', attribute_gain: 0.3, gold: 0, message: 'The secret door yields its treasures to your keen mind.' } } }
export const LargeReward = { args: { data: { xp: 1000, attribute: 'wisdom', attribute_gain: 1.0, gold: 500, message: 'A legendary quest completed!' } } }
