<script setup lang="ts">
import MenuBar from "@/components/MenuBar.vue";

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { openExternal } from "@/main";
import CommitHistory from "@/components/CommitHistory.vue";

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
</script>

<template>
  <div class="h-full dashboard-view flex flex-col">
    <MenuBar title="NEX App" class="w-full border-b relative z-10">
      <template #menu>
        <div class="flex gap-1">
          <input @input="handleSearch()" @click="handleSearch()" v-model="searchQuery" type="text" placeholder="Search resources..." class="h-fit w-fit py-2 px-4 text-sm bg-zinc-500/25 hover:bg-zinc-400/25 text-white rounded transition hover:shadow-md focus:shadow-md shadow-black/25 outline-none"/>
        </div>
      </template>
    </MenuBar>
    <div class="grow overflow-y-auto overflow-hidden">
      <div class="dashboard-header relative flex h-2/5 p-4 max-h-2/5 w-full">
        <i @click="scrollToContent" class="bi bi-caret-down-fill absolute bottom-3 right-3 z-10 w-6 h-6 flex justify-center items-center hover:bg-white/25 rounded-md hover:cursor-pointer"></i>
        <div class="flex flex-col justify-between grow">
          <div>
            <strong>NEX App</strong><br>
            <span class="text-lg">26.0.0-revision.1<br><span class="text-sm opacity-50">Reditus Magnificus</span></span>
          </div>
          <div class="flex gap-2">
            <button @click="openExternal('https://apex.zyneonstudios.com')" class="flex gap-2 bg-zinc-500/25 hover:bg-zinc-400/25 text-white h-fit font-bold py-2 px-4 rounded transition shadow-lg shadow-black/25 hover:cursor-pointer"><i class="bi bi-globe"></i> Website</button>
            <button @click="openExternal('https://discord.gg/hbHDrqUjJ8')" class="flex gap-2 bg-zinc-500/25 hover:bg-zinc-400/25 text-white h-fit font-bold py-2 px-4 rounded transition shadow-lg shadow-black/25 hover:cursor-pointer"><i class="bi bi-discord"></i> Discord</button>
            <button @click="openExternal('https://github.com/nerotvlive/nex-app')" class="flex gap-2 bg-zinc-500/25 hover:bg-zinc-400/25 text-white h-fit font-bold py-2 px-4 rounded transition shadow-lg shadow-black/25 hover:cursor-pointer"><i class="bi bi-github"></i> GitHub</button>
          </div>
        </div>
        <div class="flex flex-col justify-between text-sm">
          <div class="flex justify-end">
            <strong class="bg-yellow-200 text-lg text-black w-fit px-2 rounded-lg">BETA BUILD</strong>
          </div>
          <div class="flex gap-2">

          </div>
        </div>
      </div>
      <div class="seperator"></div>
      <div class="dashboard-content bg-zinc-800 relative p-4">
        <div class="flex gap-4">
          <CommitHistory class="p-4 w-full border border-zinc-700 bg-zinc-700/20 rounded-xl shadow-lg shadow-black/50 max-h-[81vh] overflow-hidden overflow-y-auto" />
          <div class="p-4 w-full border border-zinc-700 bg-zinc-700/20 rounded-xl shadow-lg shadow-black/50 max-h-[81vh] overflow-hidden overflow-y-auto">

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-view {

  .seperator {
    width: 100%;
    height: 1px;
    background-color: var(--color-zinc-800);
    border-top: 1px solid #ffffff25;
  }

  .dashboard-header {
    background: url("../assets/zyneonstudios/images/background.jpg");
    background-size: cover;

    img {
      backdrop-filter: blur(4px);
    }
  }

  .dashboard-content {
    background: linear-gradient(to bottom, transparent, var(--color-zinc-800));
    min-height: calc(100% + 1px);

    ::-webkit-scrollbar-track {
      margin: 0.667rem;
    }
  }
}
</style>