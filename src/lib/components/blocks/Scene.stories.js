import Scene from './Scene.svelte'
export default { title: 'Blocks/Scene', component: Scene }
export const Ominous = { args: { data: { location: 'The Thornwood', description: 'Gnarled branches claw at a moonless sky. Something watches from the dark.', mood: 'ominous' } } }
export const Neutral = { args: { data: { location: 'The Village Tavern', description: 'Firelight flickers across worn wooden tables. The barkeep eyes you with mild curiosity.', mood: 'neutral' } } }
export const Welcoming = { args: { data: { location: "Ranger's Outpost", description: 'A warm fire crackles in the hearth. Maps line every wall.', mood: 'welcoming' } } }
