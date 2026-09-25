<script setup lang="ts">
import type { Group } from '~/utils/lifx-types'

const props = defineProps<{ group: Group }>()
const emit = defineEmits<{ open: [], openLight: [id: string], power: [on: boolean], lightPower: [id: string, on: boolean] }>()

const onCount = computed(() => props.group.lights.filter(l => l.connected && l.power === 'on').length)
const anyOnline = computed(() => props.group.lights.some(l => l.connected))
</script>

<template>
  <section>
    <div class="mb-3 flex items-center gap-3">
      <button type="button" class="group flex min-w-0 flex-1 items-baseline gap-2 text-left" @click="emit('open')">
        <h2 class="truncate text-lg font-bold group-hover:underline group-hover:underline-offset-4">{{ props.group.name }}</h2>
        <span class="shrink-0 text-sm text-white/40">
          {{ onCount ? `${onCount} of ${props.group.lights.length} on` : 'All off' }}
        </span>
      </button>
      <ToggleSwitch
        :model-value="onCount > 0"
        :disabled="!anyOnline"
        :label="`Toggle ${props.group.name}`"
        @update:model-value="emit('power', $event)"
      />
    </div>
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <LightCard
        v-for="light in props.group.lights"
        :key="light.id"
        :light="light"
        @open="emit('openLight', light.id)"
        @power="emit('lightPower', light.id, $event)"
      />
    </div>
  </section>
</template>
