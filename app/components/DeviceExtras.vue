<script setup lang="ts">
import type { LifxLight } from '~/utils/lifx-types'

const props = defineProps<{ lights: LifxLight[] }>()
const { clean, setLight } = useLifx()

const hev = computed(() => props.lights.filter(l => l.product.capabilities.has_hev))
const ir = computed(() => props.lights.filter(l => l.product.capabilities.has_ir))
const infrared = computed(() => ir.value[0]?.infrared ?? 0)
const cleaning = ref(false)

function setInfrared(value: number) {
  // Only target the Nightvision bulbs, not the whole group.
  for (const l of ir.value) setLight(l, { infrared: value })
}

function toggleClean() {
  cleaning.value = !cleaning.value
  for (const l of hev.value) clean(`id:${l.id}`, !cleaning.value)
}
</script>

<template>
  <div v-if="hev.length || ir.length" class="space-y-6">
    <div v-if="hev.length" class="flex items-center gap-4 rounded-2xl bg-neutral-900 p-4">
      <div class="min-w-0 flex-1">
        <div class="font-semibold">Clean</div>
        <div class="text-sm text-white/50">Run a HEV disinfecting cycle using the device's default duration.</div>
      </div>
      <button
        type="button"
        class="rounded-full px-4 py-2 text-sm font-semibold transition"
        :class="cleaning ? 'bg-violet-400 text-black hover:bg-violet-300' : 'bg-white/10 hover:bg-white/20'"
        @click="toggleClean"
      >
        {{ cleaning ? 'Stop' : 'Start' }}
      </button>
    </div>

    <div v-if="ir.length">
      <div class="flex items-baseline justify-between">
        <span class="text-sm font-semibold uppercase tracking-wider text-white/50">Nightvision</span>
        <span class="text-sm text-white/70">{{ Math.round(infrared * 100) }}%</span>
      </div>
      <input
        type="range"
        class="lifx-range mt-3"
        style="--track: linear-gradient(to right, rgb(40 40 40), rgb(120 20 40))"
        min="0"
        max="100"
        :value="Math.round(infrared * 100)"
        aria-label="Nightvision infrared level"
        @input="setInfrared(Number(($event.target as HTMLInputElement).value) / 100)"
      >
      <p class="mt-2 text-xs text-white/40">Maximum infrared output for security cameras in the dark.</p>
    </div>
  </div>
</template>
