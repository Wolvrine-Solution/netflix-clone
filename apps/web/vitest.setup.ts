import '@testing-library/jest-dom/vitest'

/**
 * Node 25 ships a built-in `localStorage` global that is non-functional unless started with
 * `--localstorage-file`. It shadows jsdom's implementation (vitest does not overwrite existing
 * globals), so `localStorage.setItem` is not a function. Replace any broken Storage with a
 * small in-memory one. A no-op on Node versions without the built-in.
 */
function createMemoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(String(key)) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(String(key)),
    setItem: (key, value) => void data.set(String(key), String(value)),
  }
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  let broken = false
  try {
    broken = typeof globalThis[name]?.setItem !== 'function'
  } catch {
    broken = true
  }
  if (broken) {
    Object.defineProperty(globalThis, name, {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    })
  }
}
