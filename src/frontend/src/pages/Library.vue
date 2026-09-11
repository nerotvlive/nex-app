<script setup lang="ts">
import { ref, computed } from 'vue';
import MenuView from "@/components/MenuView.vue";
import LibraryInstanceView from "@/components/LibraryInstanceView.vue";
import LibraryOverview from "@/components/LibraryOverview.vue";
import { mockInstances, type InstanceItem } from '@/data/mockInstances';

const isMenuDisabled = ref(false);
const instances = ref<InstanceItem[]>(mockInstances);
const menuSearchQuery = ref('');

const currentView = ref<string>('overview');
const activeInstance = ref<InstanceItem | null>(null);

const filteredMenuInstances = computed(() => {
  if (!menuSearchQuery.value.trim()) {
    return instances.value;
  }
  const query = menuSearchQuery.value.toLowerCase();
  return instances.value.filter(inst =>
      inst.title.toLowerCase().includes(query) ||
      inst.loader.toLowerCase().includes(query) ||
      inst.version.toLowerCase().includes(query)
  );
});

const toggleMenu = () => {
  isMenuDisabled.value = !isMenuDisabled.value;
};

const showOverview = () => {
  currentView.value = 'overview';
  activeInstance.value = null;
};

const selectInstance = (instance: InstanceItem) => {
  currentView.value = instance.id;
  activeInstance.value = instance;
};

const handlePlay = (instance: InstanceItem) => {
  alert(`Launch placeholder: ${instance.title} (${instance.loader} ${instance.version})...`);
};
</script>

<template>
  <div class="library h-full w-full">
    <MenuView :isDisabled="isMenuDisabled">
      <template #menu>
        <div class="flex gap-1">
          <button @click="toggleMenu" :class="{ 'rotate-0': !isMenuDisabled, 'rotate-180': isMenuDisabled }">
            <i class="bi bi-arrow-bar-left"></i>
          </button>
          <button @click="showOverview" class="grow" :class="{ 'bg-zinc-700': currentView === 'overview' }">
            <i class="bi bi-grid-3x3-gap-fill"></i>
            Overview
          </button>
        </div>
        <div class="flex gap-1">
          <button class="grow">
            <i class="bi bi-plus-lg"></i>
            Add Instance
          </button>
          <button>
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
        <hr>
        <input v-model="menuSearchQuery" type="text" placeholder="Search instances..." class="bg-zinc-500/25 hover:bg-zinc-400/25 text-white h-fit mb-1 text-xs w-full py-2 px-4 rounded transition hover:shadow-md focus:shadow-md shadow-black/25"/>
        <button v-for="inst in filteredMenuInstances" :key="inst.id" @click="selectInstance(inst)" class="grow flex items-center gap-2" :class="{ 'active': currentView === inst.id || activeInstance?.id === inst.id }">
          <i :class="['bi', inst.icon]"><span></span></i>
          <span class="truncate">{{ inst.title }}</span>
        </button>
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
            <LibraryInstanceView :menuDisabled="isMenuDisabled" :title="activeInstance.title" :id="activeInstance.id" :key="activeInstance.id" />
          </template>
        </div>
      </template>
    </MenuView>
  </div>
</template>

<style scoped>
.library {
  .menubutton {
    position: absolute;
    z-index: 11;
    font-size: 1.25rem;
    justify-content: center;
    align-items: center;
    display: flex;
    width: 2rem;
    height: 2rem;
    margin: 0.8rem;
    border-radius: 33%;
    overflow: hidden;
    box-shadow: none !important;
  }
  .menubutton:hover {
    background: #fff3;
    cursor: pointer;
  }
  .hide {
    opacity: 0;
    z-index: -1;
  }
}
</style>