<script setup lang="ts">
import MenuBar from "@/components/MenuBar.vue";
import '@/assets/zyneonstudios/styles/components/DashboardHome.css';

import {onMounted, ref} from 'vue'
import { useRouter } from 'vue-router'
import {openExternal} from "@/assets/zyneonstudios/scripts/shared";
import CommitHistory from "@/components/CommitHistory.vue";
import {getApplicationStatus} from "@/assets/zyneonstudios/scripts/types";
import DiscordWidget from "@/components/DiscordWidget.vue";

const router = useRouter()
const searchQuery = ref('')

const handleSearch = () => {
  router.push({
    path: '/search',
    query: { q: searchQuery.value }
  })
}

const scrollToContent = () => {
  const contentElement = document.querySelector('.dashboard-content');
  contentElement?.scrollIntoView({ behavior: 'smooth' });
};

const handleCommitWheel = (event: WheelEvent) => {
  const outerContainer = document.querySelector('.dashboard-view .overflow-y-auto') as HTMLElement;
  if (!outerContainer) return;

  const isOuterAtBottom =
      Math.ceil(outerContainer.scrollTop + outerContainer.clientHeight) >= outerContainer.scrollHeight - 2;

  if (!isOuterAtBottom && event.deltaY > 0) {
    event.preventDefault();
    outerContainer.scrollTop += event.deltaY;
  }
};

const version = ref<string>("Loading");
const versionType = ref<string>('backend');
const versionBuild = ref<string>('..');
const versionName = ref<string>('Awaiting backend connection...');
onMounted(async () => {
  const status = await getApplicationStatus();
  version.value = status.version.number;
  versionType.value = status.version.type;
  versionBuild.value = status.version.build;
  versionName.value = status.version.name;
});
</script>

<template>
  <div class="h-full dashboard-view flex flex-col">
    <MenuBar title="NEX App" class="w-full border-b relative z-10 backdrop-blur-2xl" style="background: #1c1c1e99;">
      <template #menu>
        <div class="flex gap-1">
          <input @input="handleSearch()" @click="handleSearch()" v-model="searchQuery" type="text" placeholder="Search resources..." class="h-fit w-fit py-2 px-4 text-sm text-white rounded transition hover:shadow-md focus:shadow-md shadow-black/25 outline-none" style="background: #ffffff15;"/>
        </div>
      </template>
    </MenuBar>
    <div class="grow overflow-y-auto overflow-hidden">
      <div class="dashboard-header relative flex h-2/5 p-4 max-h-2/5 w-full">
        <i @click="scrollToContent" class="bi bi-caret-down-fill absolute bottom-3 right-3 z-10 w-6 h-6 flex justify-center items-center hover:bg-white/25 rounded-md hover:cursor-pointer"></i>
        <div class="flex flex-col justify-between grow">
          <div>
            <strong>NEX App</strong><br>
            <span class="text-lg">{{version}}-{{versionType}}.{{versionBuild}}<br><span class="text-sm opacity-50">{{versionName}}</span></span>
          </div>
          <div class="flex gap-2">
            <button @click="openExternal('https://apex.zyneonstudios.com')" class="flex gap-2 bg-zinc-500/25 hover:bg-zinc-400/25 text-white h-fit font-bold py-2 px-4 rounded transition shadow-lg shadow-black/25 hover:cursor-pointer"><i class="bi bi-globe"></i> Website</button>
            <button @click="openExternal('https://discord.gg/hbHDrqUjJ8')" class="flex gap-2 bg-zinc-500/25 hover:bg-zinc-400/25 text-white h-fit font-bold py-2 px-4 rounded transition shadow-lg shadow-black/25 hover:cursor-pointer"><i class="bi bi-discord"></i> Discord</button>
            <button @click="openExternal('https://github.com/nerotvlive/nex-app')" class="flex gap-2 bg-zinc-500/25 hover:bg-zinc-400/25 text-white h-fit font-bold py-2 px-4 rounded transition shadow-lg shadow-black/25 hover:cursor-pointer"><i class="bi bi-github"></i> GitHub</button>
          </div>
        </div>
        <div class="flex flex-col justify-between text-sm">
          <div class="flex justify-end">
            <strong class="bg-yellow-200 text-lg text-black w-fit px-2 rounded-lg uppercase" :class="versionType === 'stable' ? 'hidden' : ''">unstable build</strong>
          </div>
          <div class="flex gap-2">

          </div>
        </div>
      </div>
      <div class="seperator"></div>
      <div class="dashboard-content bg-zinc-800 relative p-4">
        <div class="flex gap-4">
          <CommitHistory @wheel="handleCommitWheel" class="p-4 w-full border border-zinc-700 bg-zinc-700/20 rounded-xl shadow-lg shadow-black/50 h-[81vh] overflow-hidden overflow-y-auto"/>
          <DiscordWidget class="border border-zinc-700 bg-zinc-700/20 rounded-xl shadow-lg shadow-black/50 h-[81vh] overflow-hidden overflow-y-auto" />
        </div>
      </div>
    </div>
  </div>
</template>