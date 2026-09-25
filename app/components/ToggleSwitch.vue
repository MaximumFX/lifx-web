<script setup lang="ts">
const props = defineProps<{ modelValue: boolean, disabled?: boolean, label?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="props.modelValue"
    :aria-label="props.label"
    :disabled="props.disabled"
    class="relative inline-flex h-8 w-13 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-40"
    :class="props.modelValue ? 'bg-white' : 'bg-white/15'"
    @click.stop="emit('update:modelValue', !props.modelValue)"
  >
    <span
      class="inline-block size-6 rounded-full shadow transition-transform duration-200"
      :class="props.modelValue ? 'translate-x-6 bg-black' : 'translate-x-1 bg-white'"
    />
  </button>
</template>
