<script setup lang="ts">
import type { LifxLight } from '~/utils/lifx-types'
import { THEMES, type Theme } from '~/utils/themes'

const props = defineProps<{ lights: LifxLight[] }>()
const { applyTheme } = useLifx()
const last = ref<string | null>(null)

function swatches(theme: Theme) {
  return theme.colors.map(c => rgbCss(lifxRgb(c.hue, c.saturation, c.kelvin)))
}

function apply(theme: Theme) {
  last.value = theme.name
  applyTheme(theme, props.lights)
}
</script>

<template>
  <div>
    <p class="mb-4 text-sm text-white/50">
      Spreads a palette across {{ props.lights.length === 1 ? 'this light' : 'these lights' }}. Tap again to shuffle.
    </p>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <button
        v-for="theme in THEMES"
        :key="theme.name"
        type="button"
        class="relative overflow-hidden rounded-2xl bg-neutral-900 p-3 text-left ring-2 transition hover:bg-neutral-800 active:scale-95"
        :class="last === theme.name ? 'ring-white' : 'ring-transparent'"
        @click="apply(theme)"
      >
        <div class="mb-3 flex h-10 overflow-hidden rounded-lg">
          <span v-for="(s, i) in swatches(theme)" :key="i" class="flex-1" :style="{ background: s }" />
        </div>
        <span class="text-sm font-semibold">{{ theme.name }}</span>
      </button>
    </div>
  </div>
</template>
