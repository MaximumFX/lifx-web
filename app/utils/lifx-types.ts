export interface LifxColor {
  hue: number
  saturation: number
  kelvin: number
}

export interface LifxLight {
  id: string
  uuid: string
  label: string
  connected: boolean
  power: 'on' | 'off'
  color: LifxColor
  brightness: number
  /** Running firmware effect, e.g. "OFF", "MORPH", "FLAME". */
  effect?: string
  /** Only reported for some devices; tracked locally once set. */
  infrared?: number
  zones?: { count: number }
  group: { id: string, name: string }
  location: { id: string, name: string }
  product: {
    name: string
    identifier: string
    capabilities: {
      has_color: boolean
      has_variable_color_temp: boolean
      has_ir?: boolean
      has_hev?: boolean
      has_chain?: boolean
      has_matrix?: boolean
      has_multizone?: boolean
      min_kelvin: number
      max_kelvin: number
    }
  }
  seconds_since_seen: number
}

export interface LifxStateUpdate {
  power?: 'on' | 'off'
  brightness?: number
  hue?: number
  saturation?: number
  kelvin?: number
  infrared?: number
}

export interface LifxSceneState {
  selector: string
  power?: 'on' | 'off'
  brightness?: number
  color?: Partial<LifxColor>
}

export interface LifxScene {
  uuid: string
  name: string
  states: LifxSceneState[]
}

export interface Place {
  id: string
  name: string
}

export interface Group extends Place {
  lights: LifxLight[]
}

/** A colour stop in a theme or preset. */
export interface Hsbk {
  hue: number
  saturation: number
  kelvin: number
  brightness?: number
}

export interface Preset extends Hsbk {
  id: string
  brightness: number
}
