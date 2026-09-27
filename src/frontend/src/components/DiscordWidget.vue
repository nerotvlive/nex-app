<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { openExternal } from "@/assets/zyneonstudios/scripts/shared"

const discordData = ref<any>(null)

onMounted(async () => {
  try {
    const res = await fetch('https://discord.com/api/guilds/1413125524414267556/widget.json')
    discordData.value = await res.json()
  } catch (e) {
    console.error("Could not load Discord widget", e)
  }
})
</script>

<template>
  <div class="border border-zinc-700 bg-zinc-700/20 rounded-xl shadow-lg shadow-black/50 h-[81vh] w-[350px] flex flex-col justify-between text-white">
    <div class="">
      <h3 class="font-bold text-lg mb-2 bg-[#5865F2] hover:bg-[#4752C4] p-4 py-2 hover:cursor-pointer" @click="openExternal(discordData?.instant_invite || 'https://discord.gg/g3ZwWugj9N')">Discord Server</h3>
      <div v-if="discordData" class="p-4 py-2">
        <p class="text-sm text-zinc-400 mb-4">Online: {{ discordData.presence_count }}</p>
        <div class="overflow-y-auto max-h-[56vh] flex flex-col gap-2">
          <div v-for="member in discordData.members" :key="member.id" class="flex items-center gap-2 text-xs">
            <img :src="member.avatar_url" class="w-4 h-4 rounded-full" />
            <span>{{ member.username }}</span>
          </div>
        </div>
      </div>
      <p v-else class="text-sm text-zinc-400">Loading Discord data...</p>
    </div>

    <div class="p-2 pt-0 pb-2">
      <button @click="openExternal(discordData?.instant_invite || 'https://discord.gg/g3ZwWugj9N')" class="w-full py-2 bg-[#5865F2] hover:bg-[#4752C4] font-bold rounded-lg transition text-center cursor-pointer">
        Join
      </button>
    </div>
  </div>
</template>