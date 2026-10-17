<script setup lang="ts">
import MenuBar from "@/components/MenuBar.vue";
import '@/assets/zyneonstudios/styles/components/DashboardSearch.css';
import { ref, computed, onMounted, reactive } from "vue";
import MenuView from "@/components/MenuView.vue";
import { useRoute } from "vue-router";
import { SearchResultItem } from "@/assets/zyneonstudios/scripts/search/searchResult";
import { openExternal } from "@/assets/zyneonstudios/scripts/shared";

import {SearchService, ModrinthSearchService, CurseForgeSearchService} from "@/assets/zyneonstudios/scripts/search";

const isMenuDisabled = ref(false);
const searchBar = ref<HTMLInputElement | null>(null);
const route = useRoute();

const emit = defineEmits<{
  (e: 'select', project: SearchResultItem): void;
  (e: 'install', project: SearchResultItem): void;
}>();

const viewMode = ref<'grid' | 'list'>('list');
const filterSearch = ref('');

const isVersionsOpen = ref(false);
const isUnstableVersionsOpen = ref(false);

type SearchSourceKey = 'modrinth' | 'curseforge' | 'nex' | 'combined';
const selectedSource = ref<SearchSourceKey>('modrinth');

const services = reactive<Record<string, SearchService>>({
  modrinth: new ModrinthSearchService(),
  curseforge: new CurseForgeSearchService(),
});

const activeService = computed<SearchService>(() => {
  return services[selectedSource.value] || services.modrinth;
});

const filteredReleaseVersions = computed(() => {
  const query = filterSearch.value.toLowerCase().trim();
  const releases = activeService.value.gameVersions.filter(v => v.version_type === 'release');
  if (!query) return releases;
  return releases.filter(v => v.version.toLowerCase().includes(query));
});

const filteredUnstableVersions = computed(() => {
  const query = filterSearch.value.toLowerCase().trim();
  const unstables = activeService.value.gameVersions.filter(v => v.version_type !== 'release');
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
    if (l.modOnly && activeService.value.projectType !== 'mod') return false;
    return !(query && !l.label.includes(query));
  });
});

const filteredCategories = computed(() => {
  const query = filterSearch.value.toLowerCase().trim();
  return activeService.value.categories.filter(c => {
    if (activeService.value.projectType && c.project_type !== activeService.value.projectType) return false;
    return !(query && !c.name.toLowerCase().includes(query));
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
    return !(query && !e.label.toLowerCase().includes(query));
  });
});

function onTypeChange() {
  activeService.value.setProjectType(activeService.value.projectType);
  activeService.value.search();
}

async function onSourceChange() {
  const previousQuery = activeService.value.query;

  await activeService.value.loadFilterOptions();
  if (previousQuery && !activeService.value.query) {
    activeService.value.query = previousQuery;
  }
  await activeService.value.search();
}

function handleScroll(event: Event) {
  const element = event.target as HTMLElement;
  const nearEnd = element.scrollTop + element.clientHeight >= element.scrollHeight - 150;
  if (nearEnd) {
    activeService.value.search(true);
  }
}

const toggleMenu = () => {
  isMenuDisabled.value = !isMenuDisabled.value;
};

onMounted(async () => {
  searchBar.value?.focus();

  const input = route.query.q;
  if (typeof input === "string") {
    activeService.value.query = input;
  }

  await activeService.value.loadFilterOptions();
  await activeService.value.search();
});
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
            <input v-model="filterSearch" type="text" placeholder="Search filters..." class="bg-zinc-800 hover:bg-zinc-700 text-white h-fit text-xs w-full py-2 px-3 pb-2.25 rounded-[0.4rem] transition hover:shadow-md focus:shadow-md shadow-black/25"/>
          </div>

          <div class="mx-3 flex pt-0 pb-2 border-b border-zinc-800 relative">
            <select v-model="activeService.projectType" @change="onTypeChange" class="w-full">
              <option value="mod">Mods</option>
              <option value="modpack">Modpacks</option>
              <option value="resourcepack">Resourcepacks</option>
              <option value="shader">Shaderpacks</option>
            </select>
            <i class="bi bi-chevron-down absolute right-2 top-1 mt-0.5 pointer-events-none"></i>
          </div>

          <div class="grow flex flex-col p-3 gap-1 pt-2 overflow-y-auto">

            <div class="bg-zinc-800 rounded-lg p-2 pb-1" :class="{'pb-2': isVersionsOpen}">
              <span @click="isVersionsOpen = !isVersionsOpen" class="flex justify-between items-center cursor-pointer select-none">
                <strong class="text-xs uppercase tracking-wider text-zinc-400 block mb-1">Game versions</strong>
                <i class="bi bi-caret-up-fill text-xs text-zinc-400 block mb-1 transition-transform duration-200" :class="{ 'rotate-180': !isVersionsOpen }"></i>
              </span>
              <div v-show="isVersionsOpen" class="max-h-55 overflow-y-auto flex flex-col gap-1 mt-1">
                <label v-for="version in filteredReleaseVersions" :key="version.version" class="flex items-center justify-between bg-zinc-900/50 px-2 py-1 rounded cursor-pointer hover:bg-zinc-900">
                  <span class="text-sm">{{ version.version }}</span>
                  <input type="checkbox" :value="version.version" v-model="activeService.selectedVersions" @change="activeService.search()" class="block">
                </label>
              </div>
            </div>

            <div class="bg-zinc-800 rounded-lg p-2 pb-1" :class="{'pb-2': isUnstableVersionsOpen}">
              <span @click="isUnstableVersionsOpen = !isUnstableVersionsOpen" class="flex justify-between items-center cursor-pointer select-none relative">
                <strong class="text-xs uppercase tracking-wider text-zinc-400 block mb-1">Unstable versions</strong>
                <i class="bi bi-caret-up-fill text-xs text-zinc-400 block mb-1 transition-transform duration-200" :class="{ 'rotate-180': !isUnstableVersionsOpen }"></i>
              </span>
              <div v-show="isUnstableVersionsOpen" class="max-h-55 overflow-y-auto flex flex-col gap-1 mt-1">
                <label v-for="version in filteredUnstableVersions" :key="version.version" class="flex items-center justify-between bg-zinc-900/50 px-2 py-1 rounded cursor-pointer hover:bg-zinc-900">
                  <span class="text-sm">{{ version.version }}</span>
                  <input type="checkbox" :value="version.version" v-model="activeService.selectedVersions" @change="activeService.search()" class="block">
                </label>
              </div>
            </div>

            <div class="bg-zinc-800 rounded-lg p-2" :class="activeService.projectType !== 'modpack' && activeService.projectType !== '' && activeService.projectType !== 'mod' || filteredLoaders.length === 0 ? 'hidden' : ''">
              <strong class="text-xs uppercase tracking-wider text-zinc-400 block mb-1">Loaders</strong>
              <div class="flex flex-col gap-1">
                <label v-for="loader in filteredLoaders" :key="loader.id" class="flex items-center justify-between bg-zinc-900/50 px-2 py-1 rounded cursor-pointer hover:bg-zinc-900">
                  <span class="text-sm capitalize">{{ loader.label }}</span>
                  <input type="checkbox" :value="loader.id" v-model="activeService.selectedLoaders" @change="activeService.search()" class="block">
                </label>
              </div>
            </div>

            <div class="bg-zinc-800 rounded-lg p-2" :class="filteredCategories.length === 0 ? 'hidden' : ''">
              <strong class="text-xs uppercase tracking-wider text-zinc-400 block mb-1">Categories</strong>
              <div class="overflow-y-auto flex flex-col gap-1">
                <label v-for="category in filteredCategories" :key="category.name" class="flex items-center justify-between bg-zinc-900/50 px-2 py-1 rounded cursor-pointer hover:bg-zinc-900">
                  <span class="text-sm capitalize">{{ category.name }}</span>
                  <input type="checkbox" :value="category.name" v-model="activeService.selectedCategories" @change="activeService.search()" class="block">
                </label>
              </div>
            </div>

            <div class="bg-zinc-800 rounded-lg p-2" :class="activeService.projectType !== 'modpack' && activeService.projectType !== '' && activeService.projectType !== 'mod' || filteredEnvironments.length === 0 ? 'hidden' : ''">
              <strong class="text-xs uppercase tracking-wider text-zinc-400 block mb-1">Environments</strong>
              <div class="flex flex-col gap-1">
                <label v-for="env in filteredEnvironments" :key="env.id" class="flex items-center justify-between bg-zinc-900/50 px-2 py-1 rounded cursor-pointer hover:bg-zinc-900">
                  <span class="text-sm">{{ env.label }}</span>
                  <input type="checkbox" :value="env.id" v-model="activeService.selectedEnvironments" @change="activeService.search()" class="block">
                </label>
              </div>
            </div>
          </div>

          <div class="pb-1 shadow-t">
            <div class="px-3 pt-1.5 pb-1 border-t border-zinc-800 relative">
              <strong class="text-xs uppercase tracking-wider text-zinc-400 block mb-1">Search source</strong>
              <select v-model="selectedSource" @change="onSourceChange" class="w-full">
                <option value="combined" disabled>Combined Search</option>
                <option value="nex">NEX</option>
                <option value="modrinth">Modrinth</option>
                <option value="curseforge">CurseForge</option>
              </select>
              <i class="bi bi-chevron-down absolute right-5 bottom-2.5 mt-0.75 pointer-events-none"></i>
            </div>
          </div>
        </div>
      </template>

      <template #content>
        <span @click="toggleMenu" class="menubutton" :class="{ 'hide rotate-180': !isMenuDisabled, 'rotate-0': isMenuDisabled }">
          <i class="bi bi-arrow-bar-right transition-all"></i>
        </span>
        <div class="h-full flex flex-col">

          <MenuBar :menuDisabled="isMenuDisabled" class="w-full border-b relative z-10 zyn-bg-alt">
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
              <input v-model="activeService.query" ref="searchBar" type="text" placeholder="Search resources..." @keyup.enter="activeService.search()" class="h-fit mr-13 w-fit py-2 px-4 text-sm bg-zinc-500/25 hover:bg-zinc-400/25 text-white rounded transition hover:shadow-md focus:shadow-md shadow-black/25" />
            </template>
          </MenuBar>

          <div @scroll="handleScroll" class="min-h-0 grow overflow-y-auto overview-bg p-3 pr-1">
            <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 pr-2 pb-6">
              <div v-for="proj in activeService.results" :key="proj.project_id" @click="emit('select', proj)" class="bg-zinc-600/25 hover:bg-zinc-500/25 border border-zinc-700 hover:border-zinc-600 rounded-lg p-4 flex flex-col justify-between transition cursor-pointer group shadow-lg">
                <div>
                  <div class="flex items-start justify-between mb-3">
                    <div class="max-w-12 max-h-12 min-w-12 min-h-12 rounded-md bg-zinc-700 flex items-center justify-center text-xl text-white group-hover:scale-105 transition">
                      <img v-if="proj.icon_url" :src="proj.icon_url" :alt="proj.title" class="w-full h-full object-cover rounded-md"/>
                    </div>
                    <span class="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300">
                      by {{ proj.author }}
                    </span>
                  </div>
                  <h3 class="font-bold text-lg mb-1 truncate">{{ proj.title }}</h3>
                  <p class="text-sm text-zinc-300 line-clamp-3">{{ proj.description }}</p>
                </div>
                <div class="flex justify-end gap-2 mt-4 pt-3 border-t border-t-zinc-700">
                  <button @click.stop="openExternal('https://modrinth.com/project/' + proj.slug);" class="bg-zinc-600 hover:bg-zinc-500 text-white px-3 py-1 rounded-lg text-xs xl:text-sm flex items-center gap-2 transition cursor-pointer shadow-md">
                    <i class="bi bi-box-arrow-up-right"></i>
                  </button>
                  <button @click.stop="emit('install', proj)" class="bg-green-400 hover:bg-green-300 text-black px-3 py-1 rounded-lg text-xs xl:text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-md">
                    <i class="bi bi-download"></i> Install
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="flex flex-col gap-2 pr-2 pb-6">
              <div v-for="proj in activeService.results" :key="proj.project_id" @click="emit('select', proj)" class="bg-zinc-600/25 hover:bg-zinc-500/25 border border-zinc-700 hover:border-zinc-600 rounded-lg p-3 px-4 flex gap-2 items-center justify-between transition cursor-pointer shadow-md">
                <div class="flex items-center gap-4 overflow-hidden flex-1">
                  <div class="min-w-12 max-w-12 min-h-12 max-h-12 rounded-lg bg-zinc-700 flex items-center justify-center text-lg text-white shrink-0">
                    <img v-if="proj.icon_url" :src="proj.icon_url" :alt="proj.title" class="w-full h-full object-cover rounded-md"/>
                  </div>
                  <div class="overflow-hidden flex-1">
                    <div class="flex gap-2 items-center">
                      <h3 class="font-bold text-base truncate">{{ proj.title }}</h3>
                      <span class="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 shrink-0">
                        by {{ proj.author }}
                      </span>
                    </div>
                    <p class="text-sm text-zinc-300 line-clamp-2">{{ proj.description }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <button @click.stop="openExternal('https://modrinth.com/project/' + proj.slug);" class="bg-zinc-600 hover:bg-zinc-500 text-white px-3 py-1 rounded-lg text-xs xl:text-sm flex items-center gap-2 transition cursor-pointer shadow-md">
                    <i class="bi bi-box-arrow-up-right"></i>
                  </button>
                  <button @click.stop="emit('install', proj)" class="bg-green-400 hover:bg-green-300 text-black px-3 py-1 rounded-lg text-xs xl:text-sm font-bold flex items-center gap-2 transition cursor-pointer shadow-md">
                    <i class="bi bi-download"></i> Install
                  </button>
                </div>
              </div>
            </div>

            <div v-if="activeService.loading" class="py-2 text-center text-zinc-300">
              Loading more results...
            </div>
          </div>
        </div>
      </template>
    </MenuView>
  </div>
</template>