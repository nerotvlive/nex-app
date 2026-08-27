<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ApiStatus } from './types'

const apiStatus = ref<ApiStatus | null>(null)
const isDismissed = ref(false)
const isLoading = ref(true)

async function checkApiStatus() {
  isLoading.value = true
  try {
    const response = await fetch('/api/v1/status')
    if (response.ok) {
      apiStatus.value = (await response.json()) as ApiStatus
    } else {
      apiStatus.value = null
    }
  } catch (error) {
    console.error('API Error:', error)
    apiStatus.value = null
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  checkApiStatus()
})
</script>

<template>
  <div v-if="!isLoading && !apiStatus && !isDismissed" class="bg-red-500/75 border-b border-b-zinc-400/50 shadow text-white font-mono px-4 py-1 flex justify-between items-center">
    <span>
      <strong>ERROR: </strong>API is offline!
      <button @click="checkApiStatus" class="px-2 rounded bg-zinc-800/50 hover:bg-zinc-300 hover:text-black hover:cursor-pointer ml-2">Retry</button>
    </span>
    <button @click="isDismissed = true" class="px-2 rounded bg-zinc-800 hover:bg-zinc-300 hover:text-black hover:cursor-pointer">X</button>
  </div>
  <router-view />
</template>

<style scoped>

</style>