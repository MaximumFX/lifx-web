type RGB = [number, number, number]

const clamp = (v: number, min = 0, max = 255) => Math.min(max, Math.max(min, v))

/** HSV → RGB. h in degrees, s and v in 0..1. */
export function hsvToRgb(h: number, s: number, v = 1): RGB {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return [f(5) * 255, f(3) * 255, f(1) * 255]
}

/** Approximate RGB of a black-body at the given colour temperature (Tanner Helland). */
export function kelvinToRgb(kelvin: number): RGB {
  const t = kelvin / 100
  let r: number, g: number, b: number
  if (t <= 66) {
    r = 255
    g = 99.4708025861 * Math.log(t) - 161.1195681661
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592)
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492)
    b = 255
  }
  return [clamp(r), clamp(g), clamp(b)]
}

/** Display colour for a LIFX HSBK value (brightness is ignored — pass it separately as opacity). */
export function lifxRgb(hue: number, saturation: number, kelvin: number): RGB {
  const white = kelvinToRgb(kelvin)
  const tint = hsvToRgb(hue, 1)
  return white.map((w, i) => w + (tint[i]! - w) * saturation) as RGB
}

export function rgbCss([r, g, b]: RGB, alpha = 1) {
  return `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)} / ${alpha})`
}

export function kelvinLabel(kelvin: number) {
  if (kelvin < 2500) return 'Candlelight'
  if (kelvin < 3000) return 'Warm'
  if (kelvin < 4000) return 'Soft White'
  if (kelvin < 5000) return 'Neutral'
  if (kelvin < 6500) return 'Daylight'
  return 'Cool'
}
