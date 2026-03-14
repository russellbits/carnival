import { writable } from 'svelte/store'

const { subscribe, set, update } = writable(null)

export const character = { subscribe, set, update }
export function updateCharacter(data) { set(data) }
