<script setup lang="ts">
import MenuBar from "@/components/MenuBar.vue";
import '@/assets/zyneonstudios/styles/components/DiscoverHome.css';

import {ref} from 'vue'
import DashboardSearch from "@/components/DashboardSearch.vue";

const searchQuery = ref('')
const showSearch = ref(false)

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('search') === 'true') {
  showSearch.value = true;
}

const handleSearch = () => {
  window.location.href = `/discover?search=true&q=${searchQuery.value}`;
}

const scrollToContent = () => {
  const contentElement = document.querySelector('.discover-content');
  contentElement?.scrollIntoView({ behavior: 'smooth' });
};
</script>

<template>
  <div class="h-full discover-view flex-col" :class="showSearch ? 'hidden' : 'flex'">
    <MenuBar title="NEX App" class="w-full border-b relative z-10 backdrop-blur-2xl" style="background: #1c1c1e99;">
      <template #menu>
        <div class="flex gap-1">
          <input @input="handleSearch()" @click="handleSearch()" v-model="searchQuery" type="text" placeholder="Search resources..." class="h-fit w-fit py-2 px-4 text-sm text-white rounded transition hover:shadow-md focus:shadow-md shadow-black/25 outline-none" style="background: #ffffff15;"/>
        </div>
      </template>
    </MenuBar>
    <div class="grow overflow-y-auto overflow-hidden">
      <div class="discover-header relative flex h-2/5 p-4 max-h-2/5 w-full">
        <i @click="scrollToContent" class="bi bi-caret-down-fill absolute bottom-3 right-3 z-10 w-6 h-6 flex justify-center items-center hover:bg-white/25 rounded-md hover:cursor-pointer"></i>
        <div class="flex flex-col justify-between grow">
          <div>
            <span>Pre-Title</span><br>
            <strong class="text-lg">Title</strong>
          </div>
          <div class="flex gap-2">
            <button class="flex gap-2 bg-zinc-500/25 hover:bg-zinc-400/25 text-white h-fit font-bold py-2 px-4 rounded transition shadow-lg shadow-black/25 hover:cursor-pointer"><i class="bi bi-globe"></i> Button</button>
          </div>
        </div>
        <div class="flex flex-col justify-between text-sm">
          <div class="flex justify-end">
            <strong class="bg-green-400 text-lg text-black w-fit px-2 rounded-lg uppercase">SOURCE</strong>
          </div>
          <div class="flex gap-2">

          </div>
        </div>
      </div>
      <div class="seperator"></div>
      <div class="discover-content bg-zinc-800 relative p-4">

      </div>
    </div>
  </div>
  <button @click="showSearch = false" class="flex gap-2 bg-zinc-500/25 hover:bg-zinc-400/25 text-white h-fit font-bold py-2 px-4 rounded transition shadow-lg shadow-black/25 hover:cursor-pointer absolute top-2 right-2 z-100" :class="showSearch ? 'flex' : 'hidden'"><i class="bi bi-x-lg"></i></button>
  <DashboardSearch :class="showSearch ? 'flex' : 'hidden'"/>
</template>