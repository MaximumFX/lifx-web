<script setup lang="ts">
import type { LifxLight } from '~/utils/lifx-types'

const props = defineProps<{ light: LifxLight }>()
const emit = defineEmits<{ open: [], power: [on: boolean] }>()

const isOn = computed(() => props.light.connected && props.light.power === 'on')
const color = computed(() => lifxRgb(props.light.color.hue, props.light.color.saturation, props.light.color.kelvin))
const status = computed(() => {
  if (!props.light.connected) return 'Offline'
  if (props.light.power === 'off') return 'Off'
  return `${Math.round(props.light.brightness * 100)}%`
})
</script>

<template>
  <div
    role="button"
    tabindex="0"
    class="gradient-border group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-neutral-900 p-4 transition hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
    :class="props.light.connected ? 'cursor-pointer' : 'cursor-default opacity-50'"
    :aria-disabled="!props.light.connected"
    :style="isOn ? { '--border-from': rgbCss(color, 0.25), '--border-to': 'rgb(255 255 255 / 0.02)' } : undefined"
    @click="props.light.connected && emit('open')"
    @keydown.enter="props.light.connected && emit('open')"
  >
    <!-- colour glow -->
    <div
      v-if="isOn"
      class="pointer-events-none absolute -left-10 top-1/2 size-40 -translate-y-1/2 rounded-full blur-2xl transition-opacity"
      :style="{ background: rgbCss(color, 0.35 * (0.3 + props.light.brightness * 0.7)) }"
    />

    <div
      class="relative flex size-11 shrink-0 items-center justify-center rounded-full transition-all"
      :style="isOn
        ? { background: rgbCss(color), boxShadow: `0 0 18px ${rgbCss(color, 0.6)}` }
        : { background: 'rgb(255 255 255 / 0.08)' }"
    >
      <svg viewBox="0 0 24 24" class="size-6" :class="isOn ? 'text-black/70' : 'text-white/50'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" />
      </svg>
    </div>

    <div class="relative min-w-0 flex-1">
      <div class="truncate font-semibold">{{ props.light.label }}</div>
      <div class="text-sm text-white/50">{{ status }}</div>
    </div>

    <ToggleSwitch
      class="relative"
      :model-value="isOn"
      :disabled="!props.light.connected"
      :label="`Toggle ${props.light.label}`"
      @update:model-value="emit('power', $event)"
    />
  </div>
</template>
