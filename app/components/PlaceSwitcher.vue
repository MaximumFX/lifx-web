<script setup lang="ts">
import type { Place } from '~/utils/lifx-types'

const props = defineProps<{ places: Place[], current?: Place }>()
const emit = defineEmits<{ select: [id: string] }>()
const open = ref(false)
const root = ref<HTMLElement>()

function choose(id: string) {
  emit('select', id)
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="flex items-center gap-2 text-3xl font-bold tracking-tight"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="open = !open"
    >
      {{ props.current?.name ?? 'Home' }}
      <svg
        viewBox="0 0 24 24"
        class="size-6 text-white/50 transition-transform"
        :class="{ 'rotate-180': open }"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      ><path d="m6 9 6 6 6-6" /></svg>
    </button>

    <Transition
      enter-from-class="opacity-0 -translate-y-1"
      leave-to-class="opacity-0 -translate-y-1"
      enter-active-class="transition duration-150"
      leave-active-class="transition duration-100"
    >
      <ul
        v-if="open"
        role="listbox"
        class="absolute left-0 top-full z-40 mt-3 min-w-64 overflow-hidden rounded-2xl bg-neutral-800/60 py-2 shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl backdrop-saturate-150"
      >
        <li class="px-4 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-white/40">Locations</li>
        <li v-for="place in props.places" :key="place.id">
          <button
            type="button"
            role="option"
            :aria-selected="place.id === props.current?.id"
            class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/5"
            @click="choose(place.id)"
          >
            <span class="font-medium">{{ place.name }}</span>
            <svg v-if="place.id === props.current?.id" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7" /></svg>
          </button>
        </li>
      </ul>
    </Transition>
  </div>
</template>
