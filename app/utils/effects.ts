import type { LifxLight } from './lifx-types'

export type EffectId = 'pulse' | 'breathe' | 'move' | 'morph' | 'flame' | 'clouds' | 'sunrise' | 'sunset'

export interface EffectDef {
  id: EffectId
  name: string
  description: string
  /** Effect needs a target colour (pulse / breathe). */
  needsColor?: boolean
  /** Label and range for the speed slider, in seconds (lower = faster). */
  speed: { label: string, min: number, max: number, default: number }
  supports: (light: LifxLight) => boolean
  body: (opts: { seconds: number, color?: string }) => Record<string, unknown>
}

const isMatrix = (l: LifxLight) => !!(l.product.capabilities.has_matrix || l.product.capabilities.has_chain)
const hasColor = (l: LifxLight) => l.product.capabilities.has_color

export const EFFECTS: EffectDef[] = [
  {
    id: 'pulse',
    name: 'Pulse',
    description: 'Flash quickly between the current colour and another',
    needsColor: true,
    speed: { label: 'Period', min: 0.2, max: 3, default: 1 },
    supports: hasColor,
    body: ({ seconds, color }) => ({ color, period: seconds, cycles: 10, power_on: true })
  },
  {
    id: 'breathe',
    name: 'Breathe',
    description: 'Fade smoothly back and forth to another colour',
    needsColor: true,
    speed: { label: 'Period', min: 1, max: 10, default: 4 },
    supports: hasColor,
    body: ({ seconds, color }) => ({ color, period: seconds, cycles: 10, power_on: true })
  },
  {
    id: 'move',
    name: 'Move',
    description: 'Scroll the current pattern along the strip',
    speed: { label: 'Period', min: 0.5, max: 10, default: 2 },
    supports: l => !!l.product.capabilities.has_multizone,
    body: ({ seconds }) => ({ period: seconds, direction: 'forward', power_on: true })
  },
  {
    id: 'morph',
    name: 'Morph',
    description: 'Blend flowing colours across the tiles',
    speed: { label: 'Period', min: 1, max: 20, default: 5 },
    supports: isMatrix,
    body: ({ seconds }) => ({ period: seconds, power_on: true })
  },
  {
    id: 'flame',
    name: 'Flame',
    description: 'Flickering firelight',
    speed: { label: 'Period', min: 1, max: 20, default: 5 },
    supports: isMatrix,
    body: ({ seconds }) => ({ period: seconds, power_on: true })
  },
  {
    id: 'clouds',
    name: 'Clouds',
    description: 'Slowly drifting soft colours',
    speed: { label: 'Period', min: 10, max: 120, default: 50 },
    supports: isMatrix,
    body: ({ seconds }) => ({ period: seconds, power_on: true })
  },
  {
    id: 'sunrise',
    name: 'Sunrise',
    description: 'Gently rise from darkness to daylight',
    speed: { label: 'Duration', min: 10, max: 1800, default: 300 },
    supports: isMatrix,
    body: ({ seconds }) => ({ duration: seconds, persist: true })
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Fade down to darkness, then switch off',
    speed: { label: 'Duration', min: 10, max: 1800, default: 300 },
    supports: isMatrix,
    body: ({ seconds }) => ({ duration: seconds, soft_off: true, power_on: true })
  }
]

export function formatSeconds(s: number) {
  if (s < 60) return `${Math.round(s * 10) / 10}s`
  return `${Math.round(s / 60)} min`
}
