import { writable } from 'svelte/store'

function createSession() {
  const initial = { messages: [], initialized: false, backend: 'claude' }
  const { subscribe, set, update } = writable({ ...initial })

  return {
    subscribe,
    addMessage: (msg) => update(s => ({
      ...s,
      messages: [...s.messages, msg]
    })),
    setInitialized: () => update(s => ({ ...s, initialized: true })),
    setBackend: (backend) => update(s => ({ ...s, backend })),
    clear: () => set({ ...initial }),
  }
}

export const sessionStore = createSession()

// Named exports for test ergonomics and direct imports
export const session = sessionStore
export const addMessage = sessionStore.addMessage
export const clearSession = sessionStore.clear
