<script setup lang="ts">
import type { LifxStateUpdate } from '~/utils/lifx-types'

const {
  lights, loaded, authorized, error, locations, currentLocation, groups, locationScenes,
  setLocation, refresh, logout, setLight, setGroup, setLocationState, activateScene
} = useLifx()

await callOnce('lifx:initial', refresh)

type Target = { kind: 'light' | 'group', id: string }
const target = ref<Target | null>(null)

const sheet = computed(() => {
  const t = target.value
  if (!t) return null
  if (t.kind === 'light') {
    const light = lights.value.find(l => l.id === t.id)
    if (!light) return null
    return { title: light.label, subtitle: `${light.group.name} · ${light.product.name}`, selector: `id:${light.id}`, lights: [light] }
  }
  const group = groups.value.find(g => g.id === t.id)
  if (!group) return null
  return { title: group.name, subtitle: `${group.lights.length} ${group.lights.length === 1 ? 'light' : 'lights'}`, selector: `group_id:${group.id}`, lights: group.lights }
})

function onSheetUpdate(update: LifxStateUpdate) {
  const t = target.value
  if (!t) return
  if (t.kind === 'group') return setGroup(t.id, update)
  const light = lights.value.find(l => l.id === t.id)
  if (light) setLight(light, update)
}

function lightPower(id: string, on: boolean) {
  const light = lights.value.find(l => l.id === id)
  if (light) setLight(light, { power: on ? 'on' : 'off' })
}

const locationLights = computed(() => groups.value.flatMap(g => g.lights))
const onCount = computed(() => locationLights.value.filter(l => l.connected && l.power === 'on').length)

const menuOpen = ref(false)
const refreshing = ref(false)
async function manualRefresh() {
  menuOpen.value = false
  refreshing.value = true
  await refresh()
  refreshing.value = false
}
async function signOut() {
  menuOpen.value = false
  await logout()
}

// Keep state in sync with changes made elsewhere (the app, schedules, switches…).
let poll: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  poll = setInterval(() => {
    if (authorized.value && document.visibilityState === 'visible' && !target.value) refresh()
  }, 20_000)
})
onBeforeUnmount(() => clearInterval(poll))

watch(error, (e) => {
  if (e) setTimeout(() => { if (error.value === e) error.value = null }, 5000)
})
</script>

<template>
  <LoginScreen v-if="!authorized" />

  <div v-else class="mx-auto max-w-6xl px-5 pb-24 pt-[max(2rem,env(safe-area-inset-top))] sm:px-8">
    <header class="sticky top-0 z-30 -mx-5 mb-6 flex items-center gap-3 px-5 py-4 sm:-mx-8 sm:px-8">
      <!-- Blur lives on its own layer: a backdrop-filter on the header itself would stop the
           location dropdown's backdrop-filter from seeing the page behind it. -->
      <div class="absolute inset-0 -z-10 bg-black/80 backdrop-blur-xl" />
      <div class="min-w-0 flex-1">
        <PlaceSwitcher :places="locations" :current="currentLocation" @select="setLocation" />
        <p class="mt-1 text-sm text-white/50">
          <template v-if="locationLights.length">
            {{ onCount ? `${onCount} ${onCount === 1 ? 'light' : 'lights'} on` : 'All lights off' }}
          </template>
          <template v-else-if="loaded">No lights found</template>
          <template v-else>Loading…</template>
        </p>
      </div>

      <button
        v-if="currentLocation"
        type="button"
        class="rounded-full px-4 py-2 text-sm font-semibold transition"
        :class="onCount ? 'bg-white text-black hover:bg-white/90' : 'bg-white/10 text-white hover:bg-white/20'"
        @click="setLocationState(currentLocation.id, { power: onCount ? 'off' : 'on' })"
      >
        {{ onCount ? 'All off' : 'All on' }}
      </button>

      <div class="relative">
        <button
          type="button"
          class="flex size-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          aria-label="Menu"
          @click="menuOpen = !menuOpen"
        >
          <svg viewBox="0 0 24 24" class="size-5" :class="{ 'animate-spin': refreshing }" fill="currentColor">
            <template v-if="refreshing"><path d="M12 4a8 8 0 1 0 8 8h-2a6 6 0 1 1-6-6V4Z" /></template>
            <template v-else><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></template>
          </svg>
        </button>
        <div v-if="menuOpen" class="fixed inset-0 z-40" @click="menuOpen = false" />
        <div v-if="menuOpen" class="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl bg-neutral-800/60 py-2 shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl backdrop-saturate-150">
          <button type="button" class="w-full px-4 py-3 text-left hover:bg-white/5" @click="manualRefresh">Refresh</button>
          <button type="button" class="w-full px-4 py-3 text-left text-red-400 hover:bg-white/5" @click="signOut">Disconnect</button>
        </div>
      </div>
    </header>

    <main class="space-y-10">
      <SceneRow :scenes="locationScenes" @activate="activateScene" />

      <GroupSection
        v-for="group in groups"
        :key="group.id"
        :group="group"
        @open="target = { kind: 'group', id: group.id }"
        @open-light="target = { kind: 'light', id: $event }"
        @power="setGroup(group.id, { power: $event ? 'on' : 'off' })"
        @light-power="lightPower"
      />

      <div v-if="loaded && !groups.length" class="py-24 text-center text-white/50">
        No lights are connected to this account yet.
      </div>
    </main>

    <Transition
      enter-from-class="opacity-0 translate-y-8"
      leave-to-class="opacity-0 translate-y-8"
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in"
    >
      <ControlSheet
        v-if="sheet"
        :key="`${target?.kind}:${target?.id}`"
        :title="sheet.title"
        :subtitle="sheet.subtitle"
        :selector="sheet.selector"
        :lights="sheet.lights"
        @close="target = null"
        @update="onSheetUpdate"
      />
    </Transition>

    <Transition enter-from-class="opacity-0 translate-y-4" leave-to-class="opacity-0" enter-active-class="transition" leave-active-class="transition">
      <div
        v-if="error"
        class="fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-[60] mx-auto w-fit max-w-[90vw] rounded-full bg-red-500/90 px-5 py-3 text-sm font-medium shadow-lg"
        role="alert"
      >
        {{ error }}
      </div>
    </Transition>
  </div>
</template>
