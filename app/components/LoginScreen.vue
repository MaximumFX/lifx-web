<script setup lang="ts">
const { login } = useLifx()
const token = ref('')
const busy = ref(false)
const error = ref<string | null>(null)

async function submit() {
  busy.value = true
  error.value = null
  try {
    await login(token.value)
  } catch (err) {
    const e = err as { statusCode?: number }
    error.value = e.statusCode === 401
      ? 'That token was rejected by LIFX.'
      : 'Could not reach LIFX. Try again.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center px-6">
    <div class="w-full max-w-sm">
      <div class="mb-10 flex flex-col items-center text-center">
        <div class="mb-6 size-20 rounded-full bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] p-1 shadow-[0_0_60px_rgb(255_255_255/0.15)]">
          <div class="size-full rounded-full bg-black" />
        </div>
        <h1 class="text-3xl font-bold tracking-tight">LIFX</h1>
        <p class="mt-2 text-white/50">Connect with a personal access token to control your lights.</p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <input
          v-model="token"
          type="password"
          autocomplete="off"
          placeholder="Personal access token"
          class="w-full rounded-2xl bg-neutral-900 px-5 py-4 text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-white/40"
        >
        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
        <button
          type="submit"
          :disabled="busy || !token.trim()"
          class="w-full rounded-full bg-white py-4 font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
        >
          {{ busy ? 'Connecting…' : 'Connect' }}
        </button>
      </form>

      <p class="mt-8 text-center text-sm text-white/40">
        Generate a token at
        <a href="https://cloud.lifx.com/settings" target="_blank" rel="noopener" class="text-white/70 underline underline-offset-2 hover:text-white">cloud.lifx.com/settings</a>.
        It's stored in an httpOnly cookie on this device.
      </p>
    </div>
  </div>
</template>
