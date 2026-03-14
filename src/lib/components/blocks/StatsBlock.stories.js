import StatsBlock from './StatsBlock.svelte'
export default { title: 'Blocks/StatsBlock', component: StatsBlock }

const attrs = { strength: { score: 18, emoji: '💪' }, intelligence: { score: 13, emoji: '🧠' }, wisdom: { score: 14, emoji: '🦉' }, dexterity: { score: 10, emoji: '🤹' }, constitution: { score: 12, emoji: '❤️' }, charisma: { score: 11, emoji: '🌟' } }

export const FullHP = { args: { data: { hp: 14, hp_max: 14, mp: 10, mp_max: 10, xp: 1830, xp_next: 670, level: 2, title: 'Apprentice Ranger', attributes: attrs } } }
export const LowHP = { args: { data: { hp: 3, hp_max: 14, mp: 10, mp_max: 10, xp: 1830, xp_next: 670, level: 2, title: 'Apprentice Ranger', attributes: attrs } } }
export const HighXP = { args: { data: { hp: 14, hp_max: 14, mp: 10, mp_max: 10, xp: 2400, xp_next: 100, level: 2, title: 'Apprentice Ranger', attributes: attrs } } }
export const LevelUp = { args: { data: { hp: 18, hp_max: 18, mp: 12, mp_max: 12, xp: 0, xp_next: 3000, level: 3, title: 'Journeyman Ranger', attributes: attrs } } }
