<script setup lang="ts">
import MenuBar from "@/components/MenuBar.vue";
import type { InstanceWrapper } from '@/data/instances';
import LibraryInstanceSettings from "@/components/LibraryInstanceSettings.vue";
import {ref} from "vue";

const props = defineProps<{
  menuDisabled?: boolean;
  instance: InstanceWrapper;
  settings?: boolean;
}>();

const showSettings = ref(props.settings ?? false);

const toggleSettings = () => {
  showSettings.value = !showSettings.value;
};

const scrollToContent = () => {
  const contentElement = document.querySelector('.instance-content');
  contentElement?.scrollIntoView({ behavior: 'smooth' });
};
</script>

<template>
  <div class="h-full instance-view flex flex-col">
    <MenuBar :title="instance.instance.info.name" :menuDisabled="menuDisabled" class="w-full border-b relative z-10">
      <template #menu class="instance-menu">
        <div class="flex gap-1">
          <button class="px-3 p-2 bg-blue-600 hover:bg-blue-500 hover:shadow-blue-600/10 text-white text-sm rounded transition hover:shadow-lg shadow-black/25 cursor-pointer" title="Launch instance" :class="showSettings ? '' : 'hidden'">
            <i class="bi bi-rocket-takeoff-fill"></i> LAUNCH
          </button>
          <button class="px-3 p-2 bg-blue-500/15 hover:bg-blue-500/25 text-white text-sm rounded transition hover:shadow-lg shadow-black/25 cursor-pointer hidden" title="Update instance">
            <i class="bi bi-download"></i>
          </button>
          <button class="px-3 p-2 bg-zinc-500/25 hover:bg-zinc-400/25 text-white text-sm rounded transition hover:shadow-lg shadow-black/25 cursor-pointer" title="Open instance folder">
            <i class="bi bi-folder2"></i>
          </button>
          <button @click="toggleSettings" class="px-3 p-2 text-sm rounded transition cursor-pointer" :class="showSettings ? 'bg-white/80 hover:bg-white text-black shadow-lg shadow-white-600' : 'bg-zinc-500/25 hover:bg-zinc-400/25 text-white hover:shadow-lg shadow-black/25'" title="Open instance settings">
            <i class="bi " :class="showSettings ? 'bi-x-lg' : 'bi-gear'"></i>
          </button>
        </div>
      </template>
    </MenuBar>
    <div class="grow overflow-y-auto overflow-hidden" :class="showSettings ? 'hidden absolute' : 'block relative'">
      <div class="instance-header relative flex h-2/5 max-h-2/5 justify-center items-center" :style="instance.instance.resources?.background ? { backgroundImage: `url(${instance.instance.resources.background})` } : {}">
        <i @click="scrollToContent" class="bi bi-caret-down-fill absolute bottom-3 right-3 z-10 w-6 h-6 flex justify-center items-center hover:bg-white/25 rounded-md hover:cursor-pointer"></i>
        <img v-if="instance.instance.resources?.logo" alt="" :src="instance.instance.resources.logo" class="w-full h-full object-contain bg-black/25">
      </div>
      <div class="seperator"></div>
      <div class="instance-content bg-zinc-800 relative p-4">
        <h2 class="text-xl font-bold mb-2">{{ instance.instance.info.name }}</h2>
        <p class="text-zinc-300 text-sm mb-4">{{ instance.instance.info.description }}</p>

        <button class="fixed flex gap-2 bottom-4 right-4 text-2xl p-4 px-6 rounded-lg font-bold bg-blue-600 shadow-lg shadow-black/10 hover:bg-blue-500 hover:shadow-blue-600/10 transition hover:cursor-pointer">
          <i class="bi bi-rocket-takeoff-fill"></i>
          <span>LAUNCH</span>
        </button>
      </div>
    </div>
    <div class="grow overflow-y-auto overflow-hidden" :class="showSettings ? 'block relative' : 'hidden absolute'">
      <LibraryInstanceSettings :instance="instance" />
    </div>
  </div>
</template>

<style scoped>
.instance-view {

  .seperator {
    width: 100%;
    height: 1px;
    background-color: var(--color-zinc-800);
    border-top: 1px solid #ffffff25;
  }

  .instance-header {
    background-size: cover;
    background-position: center;

    img {
      backdrop-filter: blur(4px);
    }
  }

  .instance-content {
    min-height: calc(100% + 1px);
  }
}
</style>