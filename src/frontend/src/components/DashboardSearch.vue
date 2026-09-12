<script setup lang="ts">
import MenuBar from "@/components/MenuBar.vue";
import { ref, computed, onMounted } from "vue";
import MenuView from "@/components/MenuView.vue";
import { useRoute } from "vue-router";
import {CategoryTag, GameVersion, LoaderTag, SearchResponse, SearchResultItem} from "@/types/modrinth";

const isMenuDisabled = ref(false);
const searchBar = ref<HTMLInputElement | null>(null);
const route = useRoute();

const emit = defineEmits<{
  (e: 'select', project: SearchResultItem): void;
  (e: 'install', project: SearchResultItem): void;
}>();

const viewMode = ref<'grid' | 'list'>('grid');
const searchQuery = ref('');
const filterSearch = ref('');

const selectedType = ref<'mod' | 'modpack' | 'resourcepack' | 'shader' | 'datapack' | ''>('modpack');
const selectedLoaders = ref<string[]>([]);
const selectedVersions = ref<string[]>([]);
const selectedCategories = ref<string[]>([]);
const selectedEnvironments = ref<string[]>([]);
const selectedSort = ref<'relevance' | 'downloads' | 'follows' | 'newest' | 'updated'>('relevance');

const isVersionsOpen = ref(false);
const isUnstableVersionsOpen = ref(false);

const offset = ref(0);
const limit = 24;
const hasMore = ref<boolean>(true);

const results = ref<SearchResultItem[]>([])
const loading = ref<boolean>(false);
const error = ref<string | null>(null);

const loaders = ref<LoaderTag[]>([]);
const gameVersions = ref<GameVersion[]>([]);
const categories = ref<CategoryTag[]>([]);

const filteredReleaseVersions = computed(() => {
  const query = filterSearch.value.toLowerCase().trim();
  const releases = gameVersions.value.filter(v => v.version_type === 'release');
  if (!query) return releases;
  return releases.filter(v => v.version.toLowerCase().includes(query));
});

const filteredUnstableVersions = computed(() => {
  const query = filterSearch.value.toLowerCase().trim();
  const unstables = gameVersions.value.filter(v => v.version_type !== 'release');
  if (!query) return unstables;
  return unstables.filter(v => v.version.toLowerCase().includes(query));
});

const availableLoaders = [
  { id: 'fabric', label: 'fabric' },
  { id: 'forge', label: 'forge' },
  { id: 'neoforge', label: 'neoforge' },
  { id: 'quilt', label: 'quilt' },
  { id: 'datapack', label: 'datapack', modOnly: true }
];

const filteredLoaders = computed(() => {
  const query = filterSearch.value.toLowerCase().trim();
  return availableLoaders.filter(l => {
    if (l.modOnly && selectedType.value !== 'mod') return false;
    if (query && !l.label.includes(query)) return false;
    return true;
  });
});

const filteredCategories = computed(() => {
  const query = filterSearch.value.toLowerCase().trim();
  return categories.value.filter(c => {
    if (selectedType.value && c.project_type !== selectedType.value) return false;
    if (query && !c.name.toLowerCase().includes(query)) return false;
    return true;
  });
});

const availableEnvironments = [
  { id: 'client_only', label: 'Client only' },
  { id: 'client_and_server', label: 'Client and server' },
  { id: 'server_only', label: 'Server only' },
  { id: 'dedicated_server_only', label: 'Dedicated server only' },
  { id: 'singleplayer_only', label: 'Singleplayer only' }
];

const filteredEnvironments = computed(() => {
  const query = filterSearch.value.toLowerCase().trim();
  return availableEnvironments.filter(e => {
    if (query && !e.label.toLowerCase().includes(query)) return false;
    return true;
  });
});

async function loadFilterOptions() {
  const [loaderResponse, versionResponse, categoryResponse] = await Promise.all([
    fetch('https://api.modrinth.com/v2/tag/loader'),
    fetch('https://api.modrinth.com/v2/tag/game_version'),
    fetch('https://api.modrinth.com/v2/tag/category'),
  ]);

  loaders.value = await loaderResponse.json();
  categories.value = await categoryResponse.json();

  const versions: GameVersion[] = await versionResponse.json();
  gameVersions.value = versions.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

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
    const facets: string[][] = [];

    if (selectedType.value) { facets.push([`project_type:${selectedType.value}`]) }

    if (selectedLoaders.value.length > 0) {
      facets.push(selectedLoaders.value.map(l => `categories:${l}`));
    }

    if (selectedCategories.value.length > 0) {
      facets.push(selectedCategories.value.map(c => `categories:${c}`));
    }

    if (selectedVersions.value.length > 0) {
      facets.push(selectedVersions.value.map(v => `versions:${v}`));
    }

    if (selectedEnvironments.value.length > 0) {
      facets.push(selectedEnvironments.value.map(e => `environment:${e}`));
    }

    const params = new URLSearchParams({
      query,
      limit: String(limit),
      offset: String(offset.value),
      index: selectedSort.value,
      facets: JSON.stringify(facets)
    });

    const response = await fetch(`https://api.modrinth.com/v2/search?${params}`);
    if (!response.ok) {
      window.alert("Modrinth search error: " + response.statusText);
    }

    const data: SearchResponse = await response.json();
    results.value.push(...data.hits);
    offset.value += data.hits.length;
    hasMore.value = offset.value < data.total_hits;

  } catch (e) {
    window.alert("Modrinth search error: " + e);
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
  await loadFilterOptions();
  searchModrinth(true);

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
            <button @click="toggleMenu" class="min-w-fit" :class="{ 'rotate-0': !isMenuDisabled, 'rotate-180': isMenuDisabled }">
              <i class="bi bi-arrow-bar-left"></i>
            </button>
            <input v-model="filterSearch" type="text" placeholder="Search filters..." class="bg-zinc-500/25 hover:bg-zinc-400/25 text-white h-full mb-1 text-xs w-full py-2 px-4 rounded transition hover:shadow-md focus:shadow-md shadow-black/25"/>
          </div>
          <div class="mx-3 flex pt-0 pb-1 border-b border-zinc-800 relative">
            <select v-model="selectedType" @change="selectedLoaders = []; selectedCategories = []; searchModrinth(); " class="w-full">
              <option value="mod">Mods</option>
              <option value="modpack">Modpacks</option>
              <option value="resourcepack">Resourcepacks</option>
              <option value="shader">Shaderpacks</option>
            </select>
            <i class="bi bi-chevron-down absolute right-3 bottom-2"></i>
          </div>
          <div class="grow flex flex-col p-3 gap-3 pt-2 overflow-y-auto">
            <div class="bg-zinc-800 rounded-lg p-2 pb-1" :class="{'pb-2':isVersionsOpen}">
              <span @click="isVersionsOpen = !isVersionsOpen" class="flex justify-between items-center cursor-pointer select-none">
                <strong class="text-xs uppercase tracking-wider text-zinc-400 block mb-1">Game versions</strong>
                <i class="bi bi-caret-up-fill text-xs text-zinc-400 block mb-1 transition-transform duration-200" :class="{ 'rotate-180': !isVersionsOpen }"></i>
              </span>
              <div v-show="isVersionsOpen" class="max-h-55 overflow-y-auto flex flex-col gap-1 mt-1">
                <label v-for="version in filteredReleaseVersions" :key="version.version" class="flex items-center justify-between bg-zinc-900/50 px-2 py-1 rounded cursor-pointer hover:bg-zinc-900">
                  <span class="text-sm">{{ version.version }}</span>
                  <input type="checkbox" :value="version.version" v-model="selectedVersions" @change="searchModrinth()" class="block">
                </label>
              </div>
            </div>
            <div class="bg-zinc-800 rounded-lg p-2 pb-1" :class="{'pb-2':isUnstableVersionsOpen}">
              <span @click="isUnstableVersionsOpen = !isUnstableVersionsOpen" class="flex justify-between items-center cursor-pointer select-none relative">
                <strong class="text-xs uppercase tracking-wider text-zinc-400 block mb-1">Unstable versions</strong>
                <i class="bi bi-caret-up-fill text-xs text-zinc-400 block mb-1 transition-transform duration-200" :class="{ 'rotate-180': !isUnstableVersionsOpen }"></i>
              </span>
              <div v-show="isUnstableVersionsOpen" class="max-h-55 overflow-y-auto flex flex-col gap-1 mt-1">
                <label v-for="version in filteredUnstableVersions" :key="version.version" class="flex items-center justify-between bg-zinc-900/50 px-2 py-1 rounded cursor-pointer hover:bg-zinc-900">
                  <span class="text-sm">{{ version.version }}</span>
                  <input type="checkbox" :value="version.version" v-model="selectedVersions" @change="searchModrinth()" class="block">
                </label>
              </div>
            </div>
            <div class="bg-zinc-800 rounded-lg p-2" :class="selectedType !== 'modpack' && selectedType !== '' && selectedType !== 'mod' || filteredLoaders.length === 0 ? 'hidden' : ''">
              <strong class="text-xs uppercase tracking-wider text-zinc-400 block mb-1">Loaders</strong>
              <div class="flex flex-col gap-1">
                <label v-for="loader in filteredLoaders" :key="loader.id" class="flex items-center justify-between bg-zinc-900/50 px-2 py-1 rounded cursor-pointer hover:bg-zinc-900">
                  <span class="text-sm capitalize">{{ loader.label }}</span>
                  <input type="checkbox" :value="loader.id" v-model="selectedLoaders" @change="searchModrinth()" class="block">
                </label>
              </div>
            </div>
            <div class="bg-zinc-800 rounded-lg p-2" :class="filteredCategories.length === 0 ? 'hidden' : ''">
              <strong class="text-xs uppercase tracking-wider text-zinc-400 block mb-1">Categories</strong>
              <div class="overflow-y-auto flex flex-col gap-1">
                <label v-for="category in filteredCategories" :key="category.name" class="flex items-center justify-between bg-zinc-900/50 px-2 py-1 rounded cursor-pointer hover:bg-zinc-900">
                  <span class="text-sm capitalize">{{ category.name }}</span>
                  <input type="checkbox" :value="category.name" v-model="selectedCategories" @change="searchModrinth()" class="block">
                </label>
              </div>
            </div>
            <div class="bg-zinc-800 rounded-lg p-2" :class="selectedType !== 'modpack' && selectedType !== '' && selectedType !== 'mod' || filteredEnvironments.length === 0 ? 'hidden' : ''">
              <strong class="text-xs uppercase tracking-wider text-zinc-400 block mb-1">Environments</strong>
              <div class="flex flex-col gap-1">
                <label v-for="env in filteredEnvironments" :key="env.id" class="flex items-center justify-between bg-zinc-900/50 px-2 py-1 rounded cursor-pointer hover:bg-zinc-900">
                  <span class="text-sm">{{ env.label }}</span>
                  <input type="checkbox" :value="env.id" v-model="selectedEnvironments" @change="searchModrinth()" class="block">
                </label>
              </div>
            </div>
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
                    <div class="max-w-12 max-h-12 min-w-12 min-h-12 rounded-md bg-zinc-700 flex items-center justify-center text-xl text-white group-hover:scale-105 transition">
                      <img v-if="proj.icon_url" :src="proj.icon_url" :alt="proj.title" class="w-full h-full object-cover rounded-md"/>
                    </div>
                    <span class="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300">
                      {{ proj.project_type }}
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
                  <div class="min-w-10 max-w-10 min-h-10 max-h-10 rounded-lg bg-zinc-700 flex items-center justify-center text-lg text-white">
                    <img v-if="proj.icon_url" :src="proj.icon_url" :alt="proj.title" class="w-full h-full object-cover rounded-md"/>
                  </div>
                  <div>
                    <div class="flex gap-2">
                      <h3 class="font-bold text-base">{{ proj.title }}</h3>
                      <span class="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300">
                        {{ proj.project_type }}
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