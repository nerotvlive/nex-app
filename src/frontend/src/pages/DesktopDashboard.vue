<script setup lang="ts">
import '../assets/zyneon/css/dashboard.css';
import CardStructured from "../components/shared/desktopelements/CardStructured.vue";
import SpacerHorizontalTitled from "../components/shared/desktopelements/SpacerHorizontalTitled.vue";
import CardCollapsable from "../components/shared/desktopelements/CardCollapsable.vue";
import DashboardHeader from "../components/shared/desktopelements/DashboardHeader.vue";
import {openExternal, ZyneonSettings} from "../assets/zyneon/scripts";
import GitHubCommitHistory from "../components/shared/desktopelements/third-party/GitHubCommitHistory.vue";
import {onMounted} from "vue";
import {useI18n} from "vue-i18n";
const { t } = useI18n();

onMounted(()=>{
  ZyneonSettings.setMenuExpanded(true);
})
</script>

<template>
  <div class="w-full h-full p-3">
    <DashboardHeader border="1px solid var(--zyn-ov-brighter-200)">
      <template #bottom-right>
        <a href="#dashboard-important" class="absolute bottom-0 text-md xl:text-lg">
          <button class="shadow-lg shadow-black/25">
            <i class="bi bi-caret-down-fill"></i>
          </button>
        </a>
      </template>
    </DashboardHeader>
    <SpacerHorizontalTitled id="dashboard-important">{{ t('pages.dashboard.important.title') }}</SpacerHorizontalTitled>
    <div class="flex flex-col lg:flex-row gap-3 pb-3">
      <CardStructured @click="openExternal('https://github.com/nerotvlive/nexus-nex/issues/new')" class="bg-red-900 w-full opacity-75 hover:opacity-100 transition-all cursor-pointer text-white" border="1px solid var(--zyn-ov-brighter-200)">
        <template #header>
          <strong>
            <i class="icon-message-square-warning absolute"></i>
            <span class="ml-6">{{ t('pages.dashboard.important.warning.title') }}</span>
          </strong>
        </template>
        <template #content>
          <p>
            {{ t('pages.dashboard.important.warning.line1') }}<br>
            {{ t('pages.dashboard.important.warning.line2') }}<br>
          </p>
        </template>
        <template #footer>
          <strong class="zyn-ov-darker-400 px-3 zyn-br-sm">{{ t('pages.dashboard.important.warning.button') }}</strong>
        </template>
      </CardStructured>
      <CardStructured class="bg-blue-900 w-full opacity-65 text-white" border="1px solid var(--zyn-ov-brighter-200)">
        <template #header>
          <strong>
            <i class="icon-info absolute"></i>
            <span class="ml-6">{{ t('pages.dashboard.important.note.title') }}</span>
          </strong>
        </template>
        <template #content>
          <p>
            {{ t('pages.dashboard.important.note.line1') }}<br>
            {{ t('pages.dashboard.important.note.line2') }}<br>
          </p>
        </template>
      </CardStructured>
    </div>

    <div class="flex flex-col lg:flex-row gap-3 pb-4">
      <div class="w-full lg:flex-1 min-w-0">
        <SpacerHorizontalTitled>{{t('pages.dashboard.changelogs.title')}}</SpacerHorizontalTitled>
        <div class="flex flex-col gap-2">
          <GitHubCommitHistory/>
        </div>
      </div>
      <div class="w-full lg:flex-1 min-w-0">
        <SpacerHorizontalTitled>{{t('pages.dashboard.todos.title')}}</SpacerHorizontalTitled>
        <div class="flex flex-col gap-2">
          <CardCollapsable class="zyn-ov-brighter-200" border="1px solid var(--zyn-ov-brighter-200)">
            <template #header>
              <strong>
                General to-do's
              </strong>
            </template>
            <template #content>
              <strong>Minecraft integration:</strong>
              <ul class="list-disc pl-5">
                <li>Multi-account authentication</li>
                <li>Installation</li>
                <li>Launching</li>
                <li>Management</li>
                <li>Fabric support</li>
                <li>Forge support</li>
                <li>NeoForge support</li>
                <li>Quilt support</li>
                <li>Custom modloader support</li>
                <li>evaluate more modloaders</li>
                <li>Import from NEXUS App, Modrinth App, CurseForge App, Prism and Minecraft Launcher options</li>
              </ul>
              <br>
              <strong>Modrinth Integration:</strong>
              <ul class="list-disc pl-5">
                <li>Integrate Modrinth as a search and installation source for mods, resource packs, shaders, maps, data packs, servers etc.</li>
                <li>Add a Modrinth API integration, authentication and modpack publishing and management tool</li>
              </ul>
              <br>
              <strong>CurseForge Integration:</strong>
              <ul class="list-disc pl-5">
                <li>Integrate CurseForge as a search and installation source for mods, resource packs, shaders, maps, data packs, servers etc.</li>
                <li>Add a CurseForge API integration, authentication and modpack publishing and management tool</li>
              </ul>
              <br>
              <strong>Zyneon Mods Integration:</strong>
              <ul class="list-disc pl-5">
                <li>Integrate our own content distribution platform when it's ready</li>
              </ul>
              <br>
              <strong>Local Content Integration:</strong>
              <ul class="list-disc pl-5">
                <li>Allow users to add local files and tag them to be searchable and usable in instance management/discover search</li>
              </ul>
              <br>
              <strong>Tool instances:</strong>
              <ul class="list-disc pl-5">
                <li>Add a Markdown editor</li>
                <li>Allow custom instances to add custom programs</li>
              </ul>
              <br>
              List is work in progress/possible incomplete
            </template>
          </CardCollapsable>

          <CardCollapsable class="zyn-ov-brighter-200" border="1px solid var(--zyn-ov-brighter-200)">
            <template #header>
              <strong>
                Dashboard to-do's
              </strong>
            </template>
            <template #content>
              List is coming soon (w.i.p.)
            </template>
          </CardCollapsable>

          <CardCollapsable class="zyn-ov-brighter-200" border="1px solid var(--zyn-ov-brighter-200)">
            <template #header>
              <strong>
                Discover to-do's
              </strong>
            </template>
            <template #content>
              List is coming soon (w.i.p.)
            </template>
          </CardCollapsable>

          <CardCollapsable class="zyn-ov-brighter-200" border="1px solid var(--zyn-ov-brighter-200)">
            <template #header>
              <strong>
                Library to-do's
              </strong>
            </template>
            <template #content>
              <strong>Side-menu:</strong>
              <ul class="list-disc pl-5">
                <li>Togglable active state</li>
                <li>Togglable side (left/right)</li>
                <li>Actions (Add/Remove, right/double click, import, dragging)</li>
                <li>Sortable and searchable instance list</li>
                <li>Togglable grouping</li>
              </ul>
              <br>
              <strong>Overview:</strong>
              <ul class="list-disc pl-5">
                <li>Show instead of instance view when active</li>
                <li>Changeable view modes (row, table, grid)</li>
                <li>Actions (Add/Remove, right/double click, import)</li>
                <li>Sortable and searchable</li>
                <li>Togglable grouping</li>
              </ul>
              <br>
              <strong>Instance view:</strong>
              <ul class="list-disc pl-5">
                <li>Show instead of overview when active</li>
                <li>Instance card (launch/tags/icon/short description/etc)</li>
                <li>Instance overview/readme</li>
                <li>Instance content (mods/maps/servers/shaders/resourcepacks/etc)</li>
                <li>Instance content management (add/remove/disable/update)</li>
                <li>Instance actions (start/stop/restart/kill/open folder(s))</li>
                <li>Instance folder/file browser</li>
                <li>Instance settings (link/name/version/mc ver/ml type/ml ver/java/etc)</li>
                <li>Instance versions (if linked, or saved)</li>
                <li>Instance gallery (linked images/screenshots)</li>
                <li>Instance logs</li>
                <li>Instance links (source/github/socials/etc)</li>
              </ul>
              <br>
              List is work in progress/possible incomplete
            </template>
          </CardCollapsable>

          <CardCollapsable class="zyn-ov-brighter-200" border="1px solid var(--zyn-ov-brighter-200)">
            <template #header>
              <strong>
                Settings to-do's
              </strong>
            </template>
            <template #content>
              List is coming soon (w.i.p.)
            </template>
          </CardCollapsable>

          <CardCollapsable class="zyn-ov-brighter-200" border="1px solid var(--zyn-ov-brighter-200)">
            <template #header>
              <strong>
                Downloads to-do's
              </strong>
            </template>
            <template #content>
              List is coming soon (w.i.p.)
            </template>
          </CardCollapsable>

          <CardCollapsable class="zyn-ov-brighter-200" border="1px solid var(--zyn-ov-brighter-200)">
            <template #header>
              <strong>
                Other to-do's
              </strong>
            </template>
            <template #content>
              List is coming soon (w.i.p.)
            </template>
          </CardCollapsable>

          <CardCollapsable class="zyn-ov-brighter-200" border="1px solid var(--zyn-ov-brighter-200)" disabled>
            <template #header>
              Disabled
            </template>
          </CardCollapsable>
        </div>
      </div>
    </div>
  </div>
</template>