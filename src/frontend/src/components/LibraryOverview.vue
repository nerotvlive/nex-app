<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { fetchInstances, type InstanceWrapper } from '@/data/mockInstances'; // Pfad anpassen falls nötig
import MenuBar from "@/components/MenuBar.vue";

const props = defineProps<{
  instances?: InstanceWrapper[];
  menuDisabled?: boolean;
}>();

const loadedInstances = ref<InstanceWrapper[]>([]);

onMounted(async () => {
  loadedInstances.value = await fetchInstances();
});

const currentInstances = computed(() => props.instances?.length ? props.instances : loadedInstances.value);

const emit = defineEmits<{
  (e: 'select', instance: InstanceWrapper): void;
  (e: 'play', instance: InstanceWrapper): void;
}>();

const viewMode = ref<'grid' | 'list'>('grid');
const searchQuery = ref('');

const filteredInstances = computed(() => {
  if (!searchQuery.value.trim()) {
    return currentInstances.value;
  }
  const query = searchQuery.value.toLowerCase();
  return currentInstances.value.filter(item => {
    const info = item.instance.info;
    const versions = item.instance.versions;
    return (
        info.name.toLowerCase().includes(query) ||
        info.description.toLowerCase().includes(query) ||
        info.version.toLowerCase().includes(query) ||
        (versions.fabric && versions.fabric.toLowerCase().includes(query)) ||
        (versions.forge && versions.forge.toLowerCase().includes(query)) ||
        versions.minecraft.toLowerCase().includes(query)
    );
  });
});
</script>

<template>
  <div class="h-full instance-view flex flex-col">
    <MenuBar :menuDisabled="menuDisabled" class="w-full border-b relative z-10">
      <template #title>
        <div class="flex gap-1 text-sm">
          <button @click="viewMode = 'grid'" :class="{ 'bg-zinc-700 text-white shadow-md': viewMode === 'grid', 'opacity-50 text-zinc-400': viewMode !== 'grid' }" class="px-3 p-2 bg-zinc-500/25 hover:bg-zinc-400/25 text-white rounded transition hover:shadow-lg shadow-black/25 cursor-pointer" title="Grid-Layout">
            <i class="bi bi-grid-fill"></i>
          </button>
          <button @click="viewMode = 'list'" :class="{ 'bg-zinc-700 text-white shadow-md': viewMode === 'list', 'opacity-50 text-zinc-400': viewMode !== 'list' }" class="px-3 p-2 bg-zinc-500/25 hover:bg-zinc-400/25 text-white rounded transition hover:shadow-lg shadow-black/25 cursor-pointer" title="List-Layout">
            <i class="bi bi-list-ul"></i>
          </button>
        </div>
      </template>
      <template #menu>
        <input v-model="searchQuery" type="text" placeholder="Search instances..." class="h-fit w-fit py-2 px-4 text-sm bg-zinc-500/25 hover:bg-zinc-400/25 text-white rounded transition hover:shadow-md focus:shadow-md shadow-black/25" />
      </template>
    </MenuBar>
    <div class="grow overflow-y-auto overflow-hidden overview-bg p-3 pr-1">
      <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 pr-2 pb-6">
        <div v-for="item in filteredInstances" :key="item.instance.meta.id" @click="emit('select', item)" class="bg-zinc-600/25 hover:bg-zinc-500/25 border border-zinc-700 hover:border-zinc-600 rounded-lg p-4 flex flex-col justify-between transition cursor-pointer group shadow-lg">
          <div>
            <div class="flex items-start justify-between mb-3">
              <div class="w-12 h-12 rounded-md bg-zinc-700 flex items-center justify-center text-xl text-white overflow-hidden group-hover:scale-105 transition">
                <img v-if="item.instance.resources?.thumbnail" :src="item.instance.resources.thumbnail" alt="" class="w-full h-full object-cover" />
                <i v-else class="bi bi-controller"></i>
              </div>
              <div class="flex flex-col gap-1 items-end">
                <span :class="item.instance.versions.fabric ? 'block' : 'hidden'">
                  <span class="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 flex w-fit text-nowrap">
                    Fabric
                  </span>
                </span>
                <span :class="item.instance.versions.forge ? 'block' : 'hidden'">
                  <span class="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 flex w-fit text-nowrap">
                    Forge
                  </span>
                </span>
                <span :class="item.instance.versions.neoforge ? 'block' : 'hidden'">
                  <span class="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 flex w-fit text-nowrap">
                    NeoForge
                  </span>
                </span>
                <span :class="item.instance.versions.quilt ? 'block' : 'hidden'">
                  <span class="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 flex w-fit text-nowrap">
                    Quilt
                  </span>
                </span>
                <span :class="item.instance.versions.minecraft ? 'block' : 'hidden'">
                  <span class="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 flex w-fit text-nowrap">
                    {{ item.instance.versions.minecraft }}
                  </span>
                </span>
              </div>
            </div>
            <h3 class="font-bold text-lg mb-1">{{ item.instance.info.name }}</h3>
            <p class="text-sm text-zinc-300 line-clamp-2">{{ item.instance.info.description }}</p>
          </div>

          <div class="flex justify-end gap-2 mt-4 pt-3 border-t border-t-zinc-700">
            <button @click.stop="emit('play', item)" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-md">
              <i class="bi bi-play-fill"></i> Launch
            </button>
          </div>
        </div>
      </div>


      <div v-else class="flex flex-col gap-2 pr-2 pb-6">
        <div v-for="item in filteredInstances" :key="item.instance.meta.id" @click="emit('select', item)" class="bg-zinc-600/25 hover:bg-zinc-500/25 border border-zinc-700 hover:border-zinc-600 rounded-lg p-3 px-4 flex items-center justify-between transition cursor-pointer shadow-md">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center text-lg text-white overflow-hidden shrink-0">
              <img v-if="item.instance.resources?.thumbnail" :src="item.instance.resources.thumbnail" alt="" class="w-full h-full object-cover" />
              <i v-else class="bi bi-controller"></i>
            </div>
            <div>
              <div class="flex gap-2 items-center">
                <h3 class="font-bold text-base">{{ item.instance.info.name }}</h3>
                <span :class="item.instance.versions.fabric ? 'block' : 'hidden'">
                  <span class="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 flex w-fit">
                    Fabric
                  </span>
                </span>
                <span :class="item.instance.versions.forge ? 'block' : 'hidden'">
                  <span class="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 flex w-fit">
                    Forge
                  </span>
                </span>
                <span :class="item.instance.versions.neoforge ? 'block' : 'hidden'">
                  <span class="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 flex w-fit">
                    NeoForge
                  </span>
                </span>
                <span :class="item.instance.versions.quilt ? 'block' : 'hidden'">
                  <span class="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 flex w-fit">
                    Quilt
                  </span>
                </span>
                <span :class="item.instance.versions.minecraft ? 'block' : 'hidden'">
                  <span class="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 flex w-fit">
                    {{ item.instance.versions.minecraft }}
                  </span>
                </span>
              </div>
              <p class="text-sm text-zinc-300 line-clamp-1">{{ item.instance.info.description }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click.stop="emit('play', item)" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-md">
              <i class="bi bi-play-fill"></i> Launch
            </button>
          </div>
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