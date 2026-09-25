import type { Hsbk } from './lifx-types'

export interface Theme {
  name: string
  colors: Hsbk[]
}

const c = (hue: number, saturation: number, kelvin = 3500): Hsbk => ({ hue, saturation, kelvin })
const w = (kelvin: number): Hsbk => ({ hue: 0, saturation: 0, kelvin })

export const THEMES: Theme[] = [
  { name: 'Relaxing', colors: [c(30, 0.6), c(45, 0.4), w(2500), c(20, 0.8)] },
  { name: 'Energising', colors: [c(190, 0.8), c(210, 0.6), w(6500), c(170, 0.5)] },
  { name: 'Tranquil', colors: [c(200, 0.5), c(240, 0.4), c(180, 0.35), c(260, 0.3)] },
  { name: 'Peaceful', colors: [c(120, 0.35), c(90, 0.3), w(4000), c(150, 0.4)] },
  { name: 'Dream', colors: [c(270, 0.7), c(300, 0.5), c(230, 0.6), c(320, 0.4)] },
  { name: 'Sunset', colors: [c(10, 0.9), c(30, 1), c(340, 0.8), c(50, 0.9)] },
  { name: 'Ocean', colors: [c(190, 1), c(210, 0.9), c(170, 0.8), c(230, 1)] },
  { name: 'Forest', colors: [c(110, 0.9), c(80, 0.8), c(140, 0.7), c(45, 0.6)] },
  { name: 'Party', colors: [c(0, 1), c(120, 1), c(240, 1), c(300, 1), c(60, 1)] },
  { name: 'Romance', colors: [c(340, 0.9), c(0, 0.8), c(320, 0.7), c(15, 0.5)] },
  { name: 'Spooky', colors: [c(25, 1), c(280, 1), c(100, 1), c(30, 0.9)] },
  { name: 'Holly', colors: [c(0, 1), c(120, 1), w(2700), c(355, 0.9)] }
]

/** Fisher–Yates shuffle, returns a new array. */
export function shuffled<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}
