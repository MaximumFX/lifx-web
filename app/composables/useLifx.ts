import type { Group, Hsbk, LifxLight, LifxScene, LifxSceneState, LifxStateUpdate, Place } from '~/utils/lifx-types'
import type { EffectDef } from '~/utils/effects'
import { shuffled, type Theme } from '~/utils/themes'

// The LIFX API allows ~120 requests per minute, so slider drags are throttled per selector.
const THROTTLE_MS = 350
// PUT /lights/states accepts at most 50 states per request.
const MAX_STATES = 50

interface Pending {
  timer: ReturnType<typeof setTimeout> | null
  last: number
  update: LifxStateUpdate
}

const pending = new Map<string, Pending>()
let settleTimer: ReturnType<typeof setTimeout> | undefined

function colorString(c: Partial<Hsbk>) {
  const parts: string[] = []
  if (c.hue !== undefined) parts.push(`hue:${c.hue.toFixed(1)}`)
  if (c.saturation !== undefined) parts.push(`saturation:${c.saturation.toFixed(3)}`)
  if (c.kelvin !== undefined) parts.push(`kelvin:${Math.round(c.kelvin)}`)
  return parts.join(' ')
}

function toApiBody(update: LifxStateUpdate) {
  const body: Record<string, unknown> = { duration: 0.3, fast: true }
  if (update.power) body.power = update.power
  if (update.brightness !== undefined) body.brightness = update.brightness
  if (update.infrared !== undefined) body.infrared = update.infrared
  const color = colorString(update)
  if (color) body.color = color
  return body
}

/** Whether a LIFX selector (`all`, `id:…`, `group_id:…`, `location_id:…`, optionally `|zones`) targets a light. */
function matchesSelector(selector: string, light: LifxLight) {
  const base = selector.split('|')[0]!
  if (base === 'all') return true
  const [kind, value] = base.split(/:(.*)/s) as [string, string]
  switch (kind) {
    case 'id': return light.id === value
    case 'group_id': return light.group.id === value
    case 'location_id': return light.location.id === value
    case 'label': return light.label === value
    case 'group': return light.group.name === value
    case 'location': return light.location.name === value
    default: return false
  }
}

export function useLifx() {
  const lights = useState<LifxLight[]>('lifx:lights', () => [])
  const scenes = useState<LifxScene[]>('lifx:scenes', () => [])
  const loaded = useState('lifx:loaded', () => false)
  const authorized = useState('lifx:authorized', () => true)
  const error = useState<string | null>('lifx:error', () => null)
  const locationCookie = useCookie<string | null>('lifx_location', { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })

  const locations = computed<Place[]>(() => {
    const map = new Map<string, Place>()
    for (const l of lights.value) map.set(l.location.id, { id: l.location.id, name: l.location.name })
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  })

  const currentLocation = computed<Place | undefined>(() =>
    locations.value.find(l => l.id === locationCookie.value) ?? locations.value[0]
  )

  const groups = computed<Group[]>(() => {
    const loc = currentLocation.value
    if (!loc) return []
    const map = new Map<string, Group>()
    for (const light of lights.value) {
      if (light.location.id !== loc.id) continue
      const g = map.get(light.group.id) ?? { id: light.group.id, name: light.group.name, lights: [] }
      g.lights.push(light)
      map.set(g.id, g)
    }
    for (const g of map.values()) g.lights.sort((a, b) => a.label.localeCompare(b.label))
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  })

  /** Scenes that touch at least one light in the current location. */
  const locationScenes = computed(() => {
    const loc = currentLocation.value
    if (!loc) return []
    const here = lights.value.filter(l => l.location.id === loc.id)
    return scenes.value
      .filter(s => s.states.some(st => here.some(l => matchesSelector(st.selector, l))))
      .sort((a, b) => a.name.localeCompare(b.name))
  })

  function setLocation(id: string) {
    locationCookie.value = id
  }

  function handleError(err: unknown) {
    const e = err as { statusCode?: number, statusMessage?: string, data?: { statusMessage?: string } }
    if (e.statusCode === 401) {
      authorized.value = false
      return
    }
    error.value = e.data?.statusMessage ?? e.statusMessage ?? 'Something went wrong talking to LIFX'
  }

  async function refresh() {
    try {
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
      const [newLights, newScenes] = await Promise.all([
        $fetch<LifxLight[]>('/api/lifx/lights/all', { headers }),
        $fetch<LifxScene[]>('/api/lifx/scenes', { headers }).catch(() => scenes.value)
      ])
      // Infrared isn't always reported, so keep the last value we set.
      for (const light of newLights) {
        light.infrared ??= lights.value.find(l => l.id === light.id)?.infrared
      }
      lights.value = newLights
      scenes.value = newScenes
      authorized.value = true
      error.value = null
    } catch (err) {
      handleError(err)
    } finally {
      loaded.value = true
    }
  }

  /** Re-sync with the API shortly after an action whose result we can't fully predict. */
  function refreshSoon(ms = 2000) {
    clearTimeout(settleTimer)
    settleTimer = setTimeout(refresh, ms)
  }

  async function login(token: string) {
    await $fetch('/api/auth', { method: 'POST', body: { token } })
    authorized.value = true
    await refresh()
  }

  async function logout() {
    await $fetch('/api/auth', { method: 'DELETE' })
    lights.value = []
    scenes.value = []
    authorized.value = false
  }

  /** Optimistically apply an update to local state for the lights matched by `match`. */
  function applyLocal(match: (l: LifxLight) => boolean, update: LifxStateUpdate) {
    for (const light of lights.value) {
      if (!match(light)) continue
      if (update.power) light.power = update.power
      if (update.brightness !== undefined) light.brightness = update.brightness
      if (update.hue !== undefined) light.color.hue = update.hue
      if (update.saturation !== undefined) light.color.saturation = update.saturation
      if (update.kelvin !== undefined) light.color.kelvin = update.kelvin
      if (update.infrared !== undefined) light.infrared = update.infrared
    }
  }

  async function call(path: string, method: 'PUT' | 'POST', body: Record<string, unknown>) {
    try {
      await $fetch(`/api/lifx/${path}`, { method, body })
      return true
    } catch (err) {
      handleError(err)
      await refresh()
      return false
    }
  }

  /**
   * Update lights matching `selector` (a LIFX selector such as `id:d073d5…` or `group_id:…`).
   * Local state updates immediately; network calls are throttled and coalesced.
   */
  function setState(selector: string, update: LifxStateUpdate) {
    applyLocal(l => matchesSelector(selector, l), update)

    const entry = pending.get(selector) ?? { timer: null, last: 0, update: {} }
    entry.update = { ...entry.update, ...update }
    pending.set(selector, entry)

    const flush = () => {
      const u = entry.update
      entry.update = {}
      entry.timer = null
      entry.last = Date.now()
      call(`lights/${selector}/state`, 'PUT', toApiBody(u))
    }

    if (entry.timer) return
    const wait = THROTTLE_MS - (Date.now() - entry.last)
    if (wait <= 0) flush()
    else entry.timer = setTimeout(flush, wait)
  }

  const setLight = (light: LifxLight, update: LifxStateUpdate) => setState(`id:${light.id}`, update)
  const setGroup = (groupId: string, update: LifxStateUpdate) => setState(`group_id:${groupId}`, update)
  const setLocationState = (locationId: string, update: LifxStateUpdate) => setState(`location_id:${locationId}`, update)

  /** Send many per-selector states at once via PUT /lights/states, in chunks of 50. */
  async function setStates(states: Array<{ selector: string } & Record<string, unknown>>, duration = 1) {
    for (let i = 0; i < states.length; i += MAX_STATES) {
      await call('lights/states', 'PUT', {
        states: states.slice(i, i + MAX_STATES),
        defaults: { duration },
        fast: true
      })
    }
  }

  function applySceneStateLocally(state: LifxSceneState) {
    applyLocal(l => matchesSelector(state.selector, l), {
      power: state.power,
      brightness: state.brightness,
      hue: state.color?.hue,
      saturation: state.color?.saturation,
      kelvin: state.color?.kelvin
    })
  }

  async function activateScene(scene: LifxScene) {
    scene.states.forEach(applySceneStateLocally)
    await call(`scenes/scene_id:${scene.uuid}/activate`, 'PUT', { duration: 1, fast: true })
    refreshSoon()
  }

  /**
   * Spread a theme's palette across the given lights, like the LIFX app: each call shuffles the
   * palette, and multizone strips get a band of every colour along their length.
   */
  async function applyTheme(theme: Theme, targets: LifxLight[]) {
    const online = targets.filter(l => l.connected)
    const palette = shuffled(theme.colors)
    const states: Array<{ selector: string } & Record<string, unknown>> = []

    online.forEach((light, i) => {
      const caps = light.product.capabilities
      const usable = caps.has_color ? palette : palette.filter(c => c.saturation === 0)
      const colors = usable.length ? usable : [{ hue: 0, saturation: 0, kelvin: 3500 }]
      const zoneCount = light.zones?.count ?? 0

      if (caps.has_multizone && zoneCount > 1) {
        const bands = Math.min(colors.length, zoneCount)
        for (let b = 0; b < bands; b++) {
          const start = Math.floor((b * zoneCount) / bands)
          const end = Math.floor(((b + 1) * zoneCount) / bands) - 1
          states.push({ selector: `id:${light.id}|${start}-${end}`, color: colorString(colors[b]!), power: 'on' })
        }
        applyLocal(l => l.id === light.id, { ...colors[0]!, power: 'on' })
      } else {
        const color = colors[i % colors.length]!
        states.push({ selector: `id:${light.id}`, color: colorString(color), power: 'on' })
        applyLocal(l => l.id === light.id, { ...color, power: 'on' })
      }
    })

    if (states.length) await setStates(states)
  }

  /** Apply one colour (and brightness) to lights — used by presets. */
  function applyColor(selector: string, color: Hsbk) {
    setState(selector, { ...color, power: 'on' })
  }

  async function runEffect(selector: string, effect: EffectDef, opts: { seconds: number, color?: string }) {
    for (const l of lights.value) {
      if (matchesSelector(selector, l) && effect.supports(l)) {
        l.effect = effect.id.toUpperCase()
        l.power = 'on'
      }
    }
    await call(`lights/${selector}/effects/${effect.id}`, 'POST', { ...effect.body(opts), fast: true })
    refreshSoon(3000)
  }

  async function stopEffects(selector: string) {
    for (const l of lights.value) if (matchesSelector(selector, l)) l.effect = 'OFF'
    await call(`lights/${selector}/effects/off`, 'POST', {})
    refreshSoon()
  }

  async function clean(selector: string, stop = false) {
    await call(`lights/${selector}/clean`, 'POST', stop ? { stop: true } : { duration: 0 })
    refreshSoon()
  }

  return {
    lights,
    scenes,
    loaded,
    authorized,
    error,
    locations,
    currentLocation,
    groups,
    locationScenes,
    setLocation,
    refresh,
    login,
    logout,
    setLight,
    setGroup,
    setLocationState,
    activateScene,
    applyTheme,
    applyColor,
    runEffect,
    stopEffects,
    clean
  }
}
