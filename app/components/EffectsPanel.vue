<script setup lang="ts">
import type { LifxLight } from '~/utils/lifx-types'
import { EFFECTS, formatSeconds, type EffectDef } from '~/utils/effects'

const props = defineProps<{ selector: string, lights: LifxLight[] }>()
const { runEffect, stopEffects } = useLifx()

const available = computed(() => EFFECTS.filter(e => props.lights.some(l => e.supports(l))))
const selected = ref<EffectDef | undefined>(available.value[0])
const seconds = ref(selected.value?.speed.default ?? 1)
const running = computed(() => props.lights.filter(l => l.effect && l.effect !== 'OFF'))

const colors = [
  { name: 'White', value: 'kelvin:4000 saturation:0', css: rgbCss(kelvinToRgb(4000)) },
  ...[0, 30, 55, 120, 180, 230, 275, 320].map(h => ({ name: `hue ${h}`, value: `hue:${h} saturation:1`, css: rgbCss(hsvToRgb(h, 1)) }))
]
const color = ref(colors[5]!.value)

function select(e: EffectDef) {
  selected.value = e
  seconds.value = e.speed.default
}

function start() {
  if (!selected.value) return
  runEffect(props.selector, selected.value, { seconds: seconds.value, color: selected.value.needsColor ? color.value : undefined })
}
</script>

<template>
  <div>
    <p v-if="!available.length" class="py-8 text-center text-white/50">No effects are available for this light.</p>

    <template v-else>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          v-for="e in available"
          :key="e.id"
          type="button"
          class="rounded-2xl bg-neutral-900 px-3 py-3 text-left ring-2 transition hover:bg-neutral-800"
          :class="selected?.id === e.id ? 'ring-white' : 'ring-transparent'"
          @click="select(e)"
        >
          <span class="block text-sm font-semibold">{{ e.name }}</span>
          <span class="block text-xs leading-snug text-white/50">{{ e.description }}</span>
        </button>
      </div>

      <div v-if="selected" class="mt-6 space-y-5">
        <div v-if="selected.needsColor">
          <span class="text-sm font-semibold uppercase tracking-wider text-white/50">Colour</span>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="c in colors"
              :key="c.value"
              type="button"
              class="size-8 rounded-full ring-2 ring-offset-2 ring-offset-neutral-950 transition hover:scale-110"
              :class="color === c.value ? 'ring-white' : 'ring-transparent'"
              :style="{ background: c.css }"
              :aria-label="c.name"
              @click="color = c.value"
            />
          </div>
        </div>

        <div>
          <div class="flex items-baseline justify-between">
            <span class="text-sm font-semibold uppercase tracking-wider text-white/50">{{ selected.speed.label }}</span>
            <span class="text-sm text-white/70">{{ formatSeconds(seconds) }}</span>
          </div>
          <input
            v-model.number="seconds"
            type="range"
            class="lifx-range mt-3"
            style="--track: rgb(255 255 255 / 0.12)"
            :min="selected.speed.min"
            :max="selected.speed.max"
            :step="selected.speed.max > 100 ? 10 : 0.1"
            :aria-label="selected.speed.label"
          >
        </div>

        <div class="flex gap-3">
          <button type="button" class="flex-1 rounded-full bg-white py-3 font-semibold text-black transition hover:bg-white/90" @click="start">
            Start {{ selected.name }}
          </button>
          <button
            v-if="running.length"
            type="button"
            class="rounded-full bg-white/10 px-5 py-3 font-semibold transition hover:bg-white/20"
            @click="stopEffects(props.selector)"
          >
            Stop
          </button>
        </div>
        <p v-if="running.length" class="text-center text-xs text-white/50">
          Running: {{ [...new Set(running.map(l => l.effect!.toLowerCase()))].join(', ') }}
        </p>
      </div>
    </template>
  </div>
</template>
