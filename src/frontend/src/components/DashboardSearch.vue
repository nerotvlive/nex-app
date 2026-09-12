<script setup lang="ts">
import MenuBar from "@/components/MenuBar.vue";
import { ref, onMounted } from "vue";
import MenuView from "@/components/MenuView.vue";
import { useRoute } from "vue-router";
import {SearchResponse, SearchResultItem} from "@/types/modrinth";

const isMenuDisabled = ref(false);
const searchBar = ref<HTMLInputElement | null>(null);
const route = useRoute();

const emit = defineEmits<{
  (e: 'select', project: SearchResultItem): void;
  (e: 'install', project: SearchResultItem): void;
}>();

const viewMode = ref<'grid' | 'list'>('grid');
const searchQuery = ref('');

const selectedType = ref<'mod' | 'modpack' | 'resourcepack' | 'shader' | ''>('');
const selectedLoader = ref('');
const selectedVersion = ref('');
const selectedSort = ref<'relevance' | 'downloads' | 'follows' | 'newest' | 'updated'>('relevance');

const offset = ref(0);
const limit = 24;
const hasMore = ref<boolean>(true);

const results = ref<SearchResultItem[]>([])
const loading = ref<boolean>(false);
const error = ref<string | null>(null);

const facets: string[][] = [];

if (selectedType.value) { facets.push([`projects_type:${selectedType.value}`]) }
if (selectedType.value) { facets.push([`categories:${selectedLoader.value}`]) }
if (selectedType.value) { facets.push([`versions:${selectedVersion.value}`]) }

async function searchModrinth(loadMore: boolean = false) {
  const query = searchQuery.value.trim();
  if (loading.value || (loadMore && !hasMore.value)) return;
  if (!loadMore) {
    offset.value = 0;
    results.value = [];
    hasMore.value = true;
  }

  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams({
      query,
      limit: String(limit),
      offset: String(offset.value),
      index: selectedSort.value,
      facets: JSON.stringify(facets)
    });

    const response = await fetch(`https://api.modrinth.com/v2/search?${params}`);
    if (!response.ok) {
      window.alert("Modrinth Wallah Krise: " + response.statusText);
    }

    const data: SearchResponse = await response.json();
    results.value.push(...data.hits);
    offset.value += data.hits.length;
    hasMore.value = offset.value < data.total_hits;

  } catch (e) {
    window.alert("Wallah Krise: " + e);
  } finally {
    loading.value = false;
  }
}

function handleScroll(event: Event) {
  const element = event.target as HTMLElement;
  const nearEnd = element.scrollTop + element.clientHeight >= element.scrollHeight - 150;
  if (nearEnd) searchModrinth(true);
}

onMounted(async () => {
  searchBar.value?.focus();
  searchModrinth(true)

  const input = route.query.q;
  if (typeof input === "string") {
    searchQuery.value = input;
  }
})

const toggleMenu = () => {
  isMenuDisabled.value = !isMenuDisabled.value;
};
</script>

<template>
  <div class="h-full search-view flex flex-col">
    <MenuView :isDisabled="isMenuDisabled">
      <template #menu>
        <div class="flex flex-col h-full">
          <div class="flex gap-1 p-3 pb-1">
            <button @click="toggleMenu" :class="{ 'rotate-0': !isMenuDisabled, 'rotate-180': isMenuDisabled }">
              <i class="bi bi-arrow-bar-left"></i>
            </button>
            <button class="grow">
              <i class="bi bi-grid-3x3-gap-fill"></i>
              Beispielknopf
            </button>
          </div>
          <div class="mx-3 flex pt-0 pb-1 border-b border-zinc-800">
            <button class="grow">
              <i class="bi bi-plus-lg"></i>
              Beispielknopf
            </button>
          </div>
          <div class="grow flex flex-col p-3 gap-1 pt-2 overflow-y-auto overflow-hidden">
            <button class="grow">
              <i class="bi bi-plus-lg"></i>
              Beispielknopf
            </button>
          </div>
          <div class="pb-1 shadow-t">
            <div class="px-3 pt-1 border-t border-zinc-800">
              SOURCE<br>
              SOURCE
            </div>
          </div>
        </div>
      </template>

      <template #content>
        <span @click="toggleMenu" class="menubutton" :class="{ 'hide rotate-180': !isMenuDisabled, 'rotate-0': isMenuDisabled }">
          <i class="bi bi-arrow-bar-right transition-all"></i>
        </span>
        <div class="h-full flex flex-col">
          <MenuBar :menuDisabled="isMenuDisabled" class="w-full border-b relative z-10">
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
              <input v-model="searchQuery" ref="searchBar" type="text" placeholder="Search resources..." @keyup.enter="searchModrinth()" class="h-fit w-fit py-2 px-4 text-sm bg-zinc-500/25 hover:bg-zinc-400/25 text-white rounded transition hover:shadow-md focus:shadow-md shadow-black/25" />
            </template>
          </MenuBar>

          <div @scroll="handleScroll" class="min-h-0 grow overflow-y-auto overview-bg p-3 pr-1">
            <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 pr-2 pb-6">
              <div v-for="proj in results" :key="proj.project_id" @click="emit('select', proj)" class="bg-zinc-600/25 hover:bg-zinc-500/25 border border-zinc-700 hover:border-zinc-600 rounded-lg p-4 flex flex-col justify-between transition cursor-pointer group shadow-lg">
                <div>
                  <div class="flex items-start justify-between mb-3">
                    <div class="w-12 h-12 rounded-md bg-zinc-700 flex items-center justify-center text-xl text-white group-hover:scale-105 transition">
                      <img
                          v-if="proj.icon_url"
                          :src="proj.icon_url"
                          :alt="proj.title"
                          class="w-full h-full object-cover rounded-md"
                      />
                    </div>
                    <span class="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300">
                {{ proj.project_type }} - {{ proj.versions.slice(0, 2).join(', ') }}
              </span>
                  </div>
                  <h3 class="font-bold text-lg mb-1">{{ proj.title }}</h3>
                  <p class="text-sm text-zinc-300">{{ proj.description }}</p>
                </div>

                <div class="flex justify-end gap-2 mt-4 pt-3 border-t border-t-zinc-700">
                  <button @click.stop="emit('install', proj)" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-md">
                    <i class="bi bi-download"></i> Install
                  </button>
                </div>
              </div>
            </div>


            <div v-else class="flex flex-col gap-2 pr-2 pb-6">
              <div v-for="proj in results" :key="proj.project_id" @click="emit('select', proj)" class="bg-zinc-600/25 hover:bg-zinc-500/25 border border-zinc-700 hover:border-zinc-600 rounded-lg p-3 px-4 flex items-center justify-between transition cursor-pointer shadow-md">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center text-lg text-white-400">
                    <img
                        v-if="proj.icon_url"
                        :src="proj.icon_url"
                        :alt="proj.title"
                        class="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  <div>
                    <div class="flex gap-2">
                      <h3 class="font-bold text-base">{{ proj.title }}</h3>
                      <span class="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300">
                  {{ proj.project_type }} - {{ proj.versions.slice(0, 2).join(', ') }}
                </span>
                    </div>
                    <p class="text-sm text-zinc-300">{{ proj.description }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button @click.stop="emit('install', proj)" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-md">
                    <i class="bi bi-download"></i> Install
                  </button>
                </div>
              </div>
            </div>

            <div v-if="loading" class="py-2 text-center text-zinc-300">
              Loading more results...
            </div>
          </div>
        </div>
      </template>
    </MenuView>
  </div>
</template>

<style scoped>

</style>