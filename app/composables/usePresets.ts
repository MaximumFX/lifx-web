import type { Preset } from '~/utils/lifx-types'

const STORAGE_KEY = 'lifx:presets'

/** Favourite colours, kept in this browser's localStorage. */
export function usePresets() {
  const presets = useState<Preset[]>('lifx:presets', () => [])
  const ready = useState('lifx:presets-ready', () => false)

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets.value))
    } catch {
      // Storage unavailable (private mode, blocked) — presets just won't survive a reload.
    }
  }

  onMounted(() => {
    if (ready.value) return
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
      if (Array.isArray(saved)) presets.value = saved
    } catch {
      presets.value = []
    }
    ready.value = true
  })

  function addPreset(p: Omit<Preset, 'id'>) {
    presets.value = [...presets.value, { ...p, id: crypto.randomUUID() }]
    persist()
  }

  function removePreset(id: string) {
    presets.value = presets.value.filter(p => p.id !== id)
    persist()
  }

  return { presets, addPreset, removePreset }
}
