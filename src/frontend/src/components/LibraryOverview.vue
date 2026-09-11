<script setup lang="ts">
import { ref, computed } from 'vue';
import type { InstanceItem } from '@/data/mockInstances';
import MenuBar from "@/components/MenuBar.vue";

const props = defineProps<{
  instances: InstanceItem[];
  menuDisabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', instance: InstanceItem): void;
  (e: 'play', instance: InstanceItem): void;
}>();

const viewMode = ref<'grid' | 'list'>('grid');
const searchQuery = ref('');

const filteredInstances = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.instances;
  }
  const query = searchQuery.value.toLowerCase();
  return props.instances.filter(inst =>
      inst.title.toLowerCase().includes(query) ||
      inst.loader.toLowerCase().includes(query) ||
      inst.version.toLowerCase().includes(query)
  );
});
</script>

<template>
  <MenuBar :menuDisabled="menuDisabled" class="w-full border-b absolute z-10">
    <template #title>
      <input v-model="searchQuery" type="text" placeholder="Search instances..." class="h-fit w-fit py-2 px-4 text-sm bg-zinc-500/25 hover:bg-zinc-400/25 text-white rounded transition hover:shadow-md focus:shadow-md shadow-black/25" />
    </template>
    <template #menu>
      <div class="flex gap-1 text-sm">
        <button @click="viewMode = 'grid'" :class="{ 'bg-zinc-700 text-white shadow-md': viewMode === 'grid', 'opacity-50 text-zinc-400': viewMode !== 'grid' }" class="px-3 p-2 bg-zinc-500/25 hover:bg-zinc-400/25 text-white rounded transition hover:shadow-lg shadow-black/25 cursor-pointer" title="Grid-Layout">
          <i class="bi bi-grid-fill"></i>
        </button>
        <button @click="viewMode = 'list'" :class="{ 'bg-zinc-700 text-white shadow-md': viewMode === 'list', 'opacity-50 text-zinc-400': viewMode !== 'list' }" class="px-3 p-2 bg-zinc-500/25 hover:bg-zinc-400/25 text-white rounded transition hover:shadow-lg shadow-black/25 cursor-pointer" title="List-Layout">
          <i class="bi bi-list-ul"></i>
        </button>
      </div>
    </template>
  </MenuBar>
  <div class="p-4 pr-2 pt-18 flex flex-col absolute h-full z-0 overflow-hidden overflow-y-auto w-full overview-bg">
    <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2 pb-6">
      <div v-for="inst in filteredInstances" :key="inst.id" @click="emit('select', inst)" class="bg-zinc-600/25 hover:bg-zinc-500/25 border border-zinc-700 hover:border-zinc-600 rounded-lg p-4 flex flex-col justify-between transition cursor-pointer group shadow-lg">
        <div>
          <div class="flex items-start justify-between mb-3">
            <div class="w-12 h-12 rounded-md bg-zinc-700 flex items-center justify-center text-xl text-white group-hover:scale-105 transition">
              <i :class="['bi', inst.icon]"></i>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300">
              {{ inst.loader }} {{ inst.version }}
            </span>
          </div>
          <h3 class="font-bold text-lg mb-1">{{ inst.title }}</h3>
          <p class="text-xs text-zinc-400 line-clamp-2">Lokale Instanz verwaltet über die NEX App Core Engine.</p>
        </div>

        <div class="flex justify-end gap-2 mt-4 pt-3 border-t border-zinc-600/60">
          <button @click.stop="emit('play', inst)" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-md">
            <i class="bi bi-play-fill"></i> Spielen
          </button>
        </div>
      </div>
    </div>


    <div v-else class="flex flex-col gap-2 pr-2 pb-6">
      <div v-for="inst in filteredInstances" :key="inst.id" @click="emit('select', inst)" class="bg-zinc-600/25 hover:bg-zinc-500/25 border border-zinc-700 hover:border-zinc-600 rounded-lg p-3 px-4 flex items-center justify-between transition cursor-pointer shadow-md">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center text-lg text-white-400">
            <i :class="['bi', inst.icon]"></i>
          </div>
          <div>
            <h3 class="font-bold text-base">{{ inst.title }}</h3>
            <span class="text-xs text-zinc-400">{{ inst.loader }} • Minecraft {{ inst.version }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click.stop="emit('play', inst)" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-md">
            <i class="bi bi-play-fill"></i> Spielen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview-bg {
  background: linear-gradient(to bottom, transparent, var(--color-zinc-800));
}
</style>