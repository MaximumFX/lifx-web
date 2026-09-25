<script setup lang="ts">
import type { LifxScene } from '~/utils/lifx-types'

const props = defineProps<{ scenes: LifxScene[] }>()
const emit = defineEmits<{ activate: [scene: LifxScene] }>()
const active = ref<string | null>(null)

function preview(scene: LifxScene) {
  const colors = scene.states
    .filter(s => s.power !== 'off')
    .slice(0, 4)
    .map(s => rgbCss(lifxRgb(s.color?.hue ?? 0, s.color?.saturation ?? 0, s.color?.kelvin ?? 3500)))
  if (!colors.length) return 'rgb(255 255 255 / 0.08)'
  if (colors.length === 1) colors.push(colors[0]!)
  return `linear-gradient(135deg, ${colors.join(', ')})`
}

function activate(scene: LifxScene) {
  active.value = scene.uuid
  emit('activate', scene)
  setTimeout(() => { if (active.value === scene.uuid) active.value = null }, 1500)
}
</script>

<template>
  <section v-if="props.scenes.length">
    <h2 class="mb-3 text-lg font-bold">Scenes</h2>
    <div class="-mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:scroll-px-8 sm:px-8 [scrollbar-width:none]">
      <button
        v-for="scene in props.scenes"
        :key="scene.uuid"
        type="button"
        class="group relative flex h-24 w-36 shrink-0 snap-start flex-col justify-end overflow-hidden rounded-2xl bg-neutral-900 p-3 text-left transition hover:bg-neutral-800 active:scale-95"
        @click="activate(scene)"
      >
        <div class="absolute inset-x-0 top-0 h-14 opacity-70 blur-xl transition group-hover:opacity-100" :style="{ background: preview(scene) }" />
        <div class="absolute right-3 top-3 size-6 rounded-full ring-2 ring-black/30" :style="{ background: preview(scene) }" />
        <span class="relative truncate font-semibold">{{ scene.name }}</span>
        <span class="relative text-xs text-white/50">{{ active === scene.uuid ? 'Activated' : 'Scene' }}</span>
      </button>
    </div>
  </section>
</template>
