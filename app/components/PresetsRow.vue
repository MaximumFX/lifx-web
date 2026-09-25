<script setup lang="ts">
import type { Hsbk, Preset } from '~/utils/lifx-types'

const props = defineProps<{ selector: string, current: Hsbk & { brightness: number } }>()
const { presets, addPreset, removePreset } = usePresets()
const { applyColor } = useLifx()
const editing = ref(false)

const css = (p: Hsbk) => rgbCss(lifxRgb(p.hue, p.saturation, p.kelvin))

function save() {
  addPreset({ ...props.current })
}

function tap(p: Preset) {
  if (editing.value) removePreset(p.id)
  else applyColor(props.selector, p)
}

watch(() => presets.value.length, (n) => { if (!n) editing.value = false })
</script>

<template>
  <div>
    <div class="flex items-baseline justify-between">
      <span class="text-sm font-semibold uppercase tracking-wider text-white/50">Favourites</span>
      <button
        v-if="presets.length"
        type="button"
        class="text-sm text-white/70 hover:text-white"
        @click="editing = !editing"
      >
        {{ editing ? 'Done' : 'Edit' }}
      </button>
    </div>
    <div class="mt-3 flex flex-wrap gap-3">
      <button
        v-for="p in presets"
        :key="p.id"
        type="button"
        class="relative size-11 rounded-full transition hover:scale-105"
        :class="{ 'animate-pulse': editing }"
        :style="{ background: css(p), opacity: 0.45 + p.brightness * 0.55 }"
        :aria-label="editing ? 'Remove favourite' : `Apply favourite, ${Math.round(p.brightness * 100)}% brightness`"
        :title="`${Math.round(p.brightness * 100)}%`"
        @click="tap(p)"
      >
        <span v-if="editing" class="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-neutral-700 text-xs ring-2 ring-neutral-950">✕</span>
      </button>
      <button
        v-if="!editing"
        type="button"
        class="flex size-11 items-center justify-center rounded-full border-2 border-dashed border-white/25 text-white/60 transition hover:border-white/60 hover:text-white"
        aria-label="Save current colour as favourite"
        title="Save current colour"
        @click="save"
      >
        <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </button>
    </div>
  </div>
</template>
