<script setup lang="ts">
import type { LifxLight, LifxStateUpdate } from '~/utils/lifx-types'
import { EFFECTS } from '~/utils/effects'

const props = defineProps<{
  title: string
  subtitle?: string
  /** LIFX selector for everything in this sheet, e.g. `id:…` or `group_id:…`. */
  selector: string
  lights: LifxLight[]
}>()
const emit = defineEmits<{ close: [], update: [update: LifxStateUpdate] }>()

const online = computed(() => props.lights.filter(l => l.connected))
// The sheet reflects the first powered-on light (or the first online one) as the "current" state.
const ref0 = computed(() => online.value.find(l => l.power === 'on') ?? online.value[0])

const hasColor = computed(() => online.value.some(l => l.product.capabilities.has_color))
const hasTemp = computed(() => online.value.some(l => l.product.capabilities.has_variable_color_temp))
const minKelvin = computed(() => Math.min(...online.value.map(l => l.product.capabilities.min_kelvin || 2500)))
const maxKelvin = computed(() => Math.max(...online.value.map(l => l.product.capabilities.max_kelvin || 9000)))

const isOn = computed(() => online.value.some(l => l.power === 'on'))
const hue = computed(() => ref0.value?.color.hue ?? 0)
const saturation = computed(() => ref0.value?.color.saturation ?? 0)
const kelvin = computed(() => ref0.value?.color.kelvin ?? 3500)
const brightness = computed(() => ref0.value?.brightness ?? 1)

type Tab = 'color' | 'white' | 'themes' | 'effects'
const hasEffects = computed(() => EFFECTS.some(e => online.value.some(l => e.supports(l))))
const tabs = computed(() => {
  const t: Array<{ id: Tab, label: string }> = []
  if (hasColor.value) t.push({ id: 'color', label: 'Colours' })
  if (hasTemp.value || !hasColor.value) t.push({ id: 'white', label: 'Whites' })
  if (hasColor.value) t.push({ id: 'themes', label: 'Themes' })
  if (hasEffects.value) t.push({ id: 'effects', label: 'Effects' })
  return t
})
const tab = ref<Tab>(saturation.value > 0.05 && hasColor.value ? 'color' : 'white')
watchEffect(() => {
  if (!tabs.value.some(t => t.id === tab.value)) tab.value = tabs.value[0]?.id ?? 'white'
})

const displayColor = computed(() => lifxRgb(hue.value, saturation.value, kelvin.value))

const colorPresets = [
  { name: 'Red', hue: 0 },
  { name: 'Orange', hue: 30 },
  { name: 'Yellow', hue: 55 },
  { name: 'Green', hue: 120 },
  { name: 'Cyan', hue: 180 },
  { name: 'Blue', hue: 230 },
  { name: 'Purple', hue: 275 },
  { name: 'Pink', hue: 320 }
]
const whitePresets = computed(() =>
  [2500, 2700, 3500, 4000, 5000, 6500, 9000].filter(k => k >= minKelvin.value && k <= maxKelvin.value)
)

const kelvinTrack = computed(() => {
  const stops = Array.from({ length: 6 }, (_, i) => {
    const k = minKelvin.value + ((maxKelvin.value - minKelvin.value) * i) / 5
    return rgbCss(kelvinToRgb(k))
  })
  return `linear-gradient(to right, ${stops.join(', ')})`
})
const brightnessTrack = computed(() =>
  `linear-gradient(to right, rgb(40 40 40), ${rgbCss(displayColor.value)})`
)

// Changing colour or brightness also switches the light on, like the LIFX app.
function update(u: LifxStateUpdate) {
  emit('update', isOn.value ? u : { ...u, power: 'on' })
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-start sm:p-6 sm:pt-[10vh]">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="emit('close')" />

    <div
      class="relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-y-auto rounded-t-3xl bg-neutral-950 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl ring-1 ring-white/10 sm:rounded-3xl"
      role="dialog"
      aria-modal="true"
      :aria-label="props.title"
    >
      <!-- Tinted header -->
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-56 transition-colors"
        :style="{ background: isOn ? `linear-gradient(to bottom, ${rgbCss(displayColor, 0.35 * brightness + 0.1)}, transparent)` : 'none' }"
      />

      <div class="relative mx-auto mt-2 h-1.5 w-10 rounded-full bg-white/20 sm:hidden" />

      <header class="relative flex items-center gap-3 px-6 pt-4">
        <button
          type="button"
          class="-ml-2 flex size-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Close"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <div class="min-w-0 flex-1">
          <h2 class="truncate text-xl font-bold">{{ props.title }}</h2>
          <p v-if="props.subtitle" class="truncate text-sm text-white/50">{{ props.subtitle }}</p>
        </div>
        <ToggleSwitch
          :model-value="isOn"
          :disabled="!online.length"
          label="Power"
          @update:model-value="emit('update', { power: $event ? 'on' : 'off' })"
        />
      </header>

      <div v-if="!online.length" class="relative px-6 py-16 text-center text-white/50">
        All lights are offline.
      </div>

      <template v-else>
        <!-- Tabs -->
        <div
          v-if="tabs.length > 1"
          class="relative mx-6 mt-6 grid rounded-full bg-white/10 p-1 text-sm font-semibold"
          :style="{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }"
        >
          <button
            v-for="t in tabs"
            :key="t.id"
            type="button"
            class="rounded-full py-2 transition"
            :class="tab === t.id ? 'bg-white text-black' : 'text-white/70 hover:text-white'"
            @click="tab = t.id"
          >
            {{ t.label }}
          </button>
        </div>

        <!-- Colours -->
        <section v-if="tab === 'color' && hasColor" class="relative px-6 pt-6">
          <div class="mx-auto w-full max-w-72">
            <ColorWheel
              :hue="hue"
              :saturation="saturation"
              @change="update({ hue: $event.hue, saturation: $event.saturation })"
            />
          </div>
          <div class="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
            <button
              v-for="p in colorPresets"
              :key="p.name"
              type="button"
              class="size-8 rounded-full ring-2 ring-offset-2 ring-offset-neutral-950 transition hover:scale-110 sm:size-9"
              :class="Math.abs(hue - p.hue) < 3 && saturation > 0.95 ? 'ring-white' : 'ring-transparent'"
              :style="{ background: rgbCss(hsvToRgb(p.hue, 1)) }"
              :aria-label="p.name"
              :title="p.name"
              @click="update({ hue: p.hue, saturation: 1 })"
            />
          </div>
        </section>

        <!-- Whites -->
        <section v-if="tab === 'white'" class="relative px-6 pt-6">
          <div class="flex items-baseline justify-between">
            <span class="text-sm font-semibold uppercase tracking-wider text-white/50">Temperature</span>
            <span class="text-sm text-white/70">{{ kelvinLabel(kelvin) }} · {{ Math.round(kelvin) }}K</span>
          </div>
          <input
            type="range"
            class="lifx-range mt-3"
            :style="{ '--track': kelvinTrack }"
            :min="minKelvin"
            :max="maxKelvin"
            step="50"
            :value="kelvin"
            aria-label="Colour temperature"
            @input="update({ kelvin: Number(($event.target as HTMLInputElement).value), saturation: 0 })"
          >
          <div class="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-7">
            <button
              v-for="k in whitePresets"
              :key="k"
              type="button"
              class="flex flex-col items-center gap-1.5 rounded-xl py-2 text-xs text-white/60 transition hover:bg-white/5"
              @click="update({ kelvin: k, saturation: 0 })"
            >
              <span
                class="size-9 rounded-full ring-2 ring-offset-2 ring-offset-neutral-950"
                :class="saturation < 0.05 && Math.abs(kelvin - k) < 60 ? 'ring-white' : 'ring-transparent'"
                :style="{ background: rgbCss(kelvinToRgb(k)) }"
              />
              {{ k }}K
            </button>
          </div>
        </section>

        <!-- Themes -->
        <section v-if="tab === 'themes'" class="relative px-6 pt-6">
          <ThemesPanel :lights="online" />
        </section>

        <!-- Effects -->
        <section v-if="tab === 'effects'" class="relative px-6 pt-6">
          <EffectsPanel :selector="props.selector" :lights="online" />
        </section>

        <!-- Brightness -->
        <section class="relative px-6 pt-8">
          <div class="flex items-baseline justify-between">
            <span class="text-sm font-semibold uppercase tracking-wider text-white/50">Brightness</span>
            <span class="text-sm text-white/70">{{ Math.round(brightness * 100) }}%</span>
          </div>
          <input
            type="range"
            class="lifx-range mt-3"
            :style="{ '--track': brightnessTrack }"
            min="1"
            max="100"
            :value="Math.round(brightness * 100)"
            aria-label="Brightness"
            @input="update({ brightness: Number(($event.target as HTMLInputElement).value) / 100 })"
          >
        </section>

        <!-- Favourites -->
        <section v-if="tab === 'color' || tab === 'white'" class="relative px-6 pt-8">
          <PresetsRow :selector="props.selector" :current="{ hue, saturation, kelvin, brightness }" />
        </section>

        <!-- Device-specific extras (Clean, Nightvision) -->
        <section class="relative px-6 pt-8 empty:hidden">
          <DeviceExtras :lights="online" />
        </section>
      </template>
    </div>
  </div>
</template>
