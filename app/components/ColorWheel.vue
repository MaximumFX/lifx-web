<script setup lang="ts">
const props = defineProps<{ hue: number, saturation: number }>()
const emit = defineEmits<{ change: [value: { hue: number, saturation: number }] }>()

const wheel = ref<HTMLDivElement>()
const dragging = ref(false)

const handleStyle = computed(() => {
  const angle = (props.hue * Math.PI) / 180
  const r = props.saturation * 50
  return {
    left: `${50 + Math.sin(angle) * r}%`,
    top: `${50 - Math.cos(angle) * r}%`,
    background: rgbCss(hsvToRgb(props.hue, props.saturation))
  }
})

function pick(e: PointerEvent) {
  const rect = wheel.value!.getBoundingClientRect()
  const dx = e.clientX - (rect.left + rect.width / 2)
  const dy = e.clientY - (rect.top + rect.height / 2)
  const hue = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360
  const saturation = Math.min(1, Math.hypot(dx, dy) / (rect.width / 2))
  emit('change', { hue, saturation })
}

function onDown(e: PointerEvent) {
  dragging.value = true
  wheel.value!.setPointerCapture(e.pointerId)
  pick(e)
}
function onMove(e: PointerEvent) {
  if (dragging.value) pick(e)
}
function onUp() {
  dragging.value = false
}
</script>

<template>
  <div
    ref="wheel"
    class="relative aspect-square w-full touch-none select-none rounded-full"
    style="background: radial-gradient(closest-side, #fff, rgb(255 255 255 / 0)), conic-gradient(red, yellow, lime, cyan, blue, magenta, red)"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointercancel="onUp"
  >
    <div
      class="pointer-events-none absolute size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow-[0_2px_10px_rgb(0_0_0/0.5)] transition-transform"
      :class="{ 'scale-125': dragging }"
      :style="handleStyle"
    />
  </div>
</template>
