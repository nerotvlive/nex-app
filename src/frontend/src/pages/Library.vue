<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MenuView from "@/components/MenuView.vue";
import LibraryInstanceView from "@/components/LibraryInstanceView.vue";
import LibraryOverview from "@/components/LibraryOverview.vue";
import { fetchInstances, type InstanceWrapper } from '@/data/mockInstances';

const isMenuDisabled = ref(false);
const instances = ref<InstanceWrapper[]>([]);
const menuSearchQuery = ref('');

const currentView = ref<string>('overview');
const activeInstance = ref<InstanceWrapper | null>(null);

onMounted(async () => {
  instances.value = await fetchInstances();
});

const filteredMenuInstances = computed(() => {
  if (!menuSearchQuery.value.trim()) {
    return instances.value;
  }
  const query = menuSearchQuery.value.toLowerCase();
  return instances.value.filter(item => {
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

const toggleMenu = () => {
  isMenuDisabled.value = !isMenuDisabled.value;
};

const showOverview = () => {
  currentView.value = 'overview';
  activeInstance.value = null;
};

const selectInstance = (item: InstanceWrapper) => {
  const instanceId = item.instance.meta.id;
  currentView.value = instanceId;
  activeInstance.value = item;
};

const handlePlay = (item: InstanceWrapper) => {
  const info = item.instance.info;
  const versions = item.instance.versions;
  const loaderName = versions.fabric ? 'Fabric' : 'Forge';
  const loaderVersion = versions.fabric || versions.forge || '';
  alert(`Launch placeholder: ${info.name} (${loaderName} ${loaderVersion})...`);
};
</script>

<template>
  <div class="library h-full w-full">
    <MenuView :isDisabled="isMenuDisabled">
      <template #menu>
        <div class="flex flex-col h-full">
          <div class="flex gap-1 p-3 pb-1">
            <button @click="toggleMenu" :class="{ 'rotate-0': !isMenuDisabled, 'rotate-180': isMenuDisabled }">
              <i class="bi bi-arrow-bar-left"></i>
            </button>
            <button @click="showOverview" class="grow" :class="{ 'bg-zinc-700': currentView === 'overview' }">
              <i class="bi bi-grid-3x3-gap-fill"></i>
              Overview
            </button>
          </div>
          <div class="mx-3 pt-0 pb-1 border-b border-zinc-800">
            <div class="flex gap-1 pb-2">
              <button class="grow">
                <i class="bi bi-plus-lg"></i>
                Add Instance
              </button>
              <button @click="async () => { instances = await fetchInstances(); }">
                <i class="bi bi-arrow-clockwise"></i>
              </button>
            </div>
            <input v-model="menuSearchQuery" type="text" placeholder="Search instances..." class="bg-zinc-500/25 hover:bg-zinc-400/25 text-white h-fit mb-1 text-xs w-full py-2 px-4 rounded transition hover:shadow-md focus:shadow-md shadow-black/25"/>
          </div>
          <div class="grow flex flex-col p-3 gap-1 pt-2 overflow-y-auto overflow-hidden">
            <button v-for="item in filteredMenuInstances" :key="item.instance.meta.id" @click="selectInstance(item)" class="grow flex items-center gap-2" :class="{ 'active': currentView === item.instance.meta.id || activeInstance?.instance.meta.id === item.instance.meta.id }">
              <span class="w-5 h-5 rounded bg-zinc-700 flex items-center justify-center text-xs text-white overflow-hidden shrink-0">
                <img v-if="item.instance.resources?.icon" :src="item.instance.resources.icon" alt="" class="w-full h-full object-cover" />
                <i v-else class="bi bi-controller"></i>
              </span>
              <span class="truncate">{{ item.instance.info.name }}</span>
            </button>
          </div>
          <div class="pb-1 shadow-t">
            <div class="px-3 pt-1 border-t border-zinc-800">
              ACCOUNT<br>
              ACCOUNT
            </div>
          </div>
        </div>
      </template>

      <template #content>
        <span @click="toggleMenu" class="menubutton" :class="{ 'hide rotate-180': !isMenuDisabled, 'rotate-0': isMenuDisabled }">
          <i class="bi bi-arrow-bar-right transition-all"></i>
        </span>

        <div class="h-full flex flex-col relative">
          <template v-if="currentView === 'overview'">
            <LibraryOverview :menuDisabled="isMenuDisabled" :instances="instances" @select="selectInstance" @play="handlePlay" />
          </template>
          <template v-else-if="activeInstance">
            <LibraryInstanceView :menuDisabled="isMenuDisabled" :instance="activeInstance" :key="activeInstance.instance.meta.id" />
          </template>
        </div>
      </template>
    </MenuView>
  </div>
</template>

<style scoped>

</style>