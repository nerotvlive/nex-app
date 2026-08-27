<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ApiStatus } from './types'
import Menu from "@/components/Menu.vue";

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
  <div class="absolute flex w-full h-full shadow-inset-from-top">
    <Menu>

    </Menu>
    <div class="grow">
      <div v-if="!isLoading && !apiStatus && !isDismissed" class="bg-red-500/75 border-b border-b-zinc-400/50 shadow text-white font-mono px-4 py-1 flex justify-between items-center fixed w-full">
        <span>
          <strong>ERROR: </strong>Couldn't connect to the API!
          <button @click="checkApiStatus" class="px-2 rounded bg-zinc-800/50 hover:bg-zinc-300 hover:text-black hover:cursor-pointer ml-2">Retry</button>
        </span>
        <button @click="isDismissed = true" class="px-2 rounded bg-zinc-800 hover:bg-zinc-300 hover:text-black hover:cursor-pointer">X</button>
      </div>
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.shadow-inset-from-top {
  box-shadow: inset 0 0.1rem 0.3rem 0 #00000050;
}
</style>