<script setup lang="ts">
  import DesktopTitlebar from "./components/shared/DesktopTitlebar.vue";
  import DesktopRootView from "./components/shared/DesktopRootView.vue";
  import DesktopPane from "./components/shared/DesktopPane.vue";
  import DesktopSideMenu from "./components/shared/DesktopSideMenu.vue";
  import Badge from "./components/shared/desktopelements/Badge.vue";
  import { onMounted } from 'vue'
  import {ZyneonSettings} from "./assets/zyneon/scripts";
  import {getApiStatus} from "./assets/zyneon/scripts";
  import {useI18n} from "vue-i18n";

  const { t } = useI18n();

  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
  })

  onMounted(() => {
    ZyneonSettings.setClassicMenu(ZyneonSettings.useClassicMenu);
    ZyneonSettings.setBackgroundColor(ZyneonSettings.getBackgroundColor());
    ZyneonSettings.setBackgroundAccent(ZyneonSettings.getBackgroundAccent());
    ZyneonSettings.setRoundedCorners(false,ZyneonSettings.getRoundedCorners());
    ZyneonSettings.setBackgroundAccentOpacity(false,ZyneonSettings.getBackgroundAccentOpacity());
  })
</script>

<template>
  <div class="zyneon-desktop zyn-background-body" id="main">
    <DesktopTitlebar class="zyneon-desktop-titlebar" title="Zyneon Desktop" id="titlebar">
      <template #start>
        <div class="w-full h-full gap-2 flex justify-start items-center">
          <img alt="" class="z-n1 h-4 ml-3" src="./assets/zyneon/img/nex-app-title.png">
        </div>
      </template>
      <template #title>
        <div class="hidden"/>
      </template>
      <template #end>
        <div class="w-full h-full gap-2 flex justify-end items-center pr-6">
          <Badge class="mr-2" background="var(--color-red-300)">
            <strong class="text-red-900">{{getApiStatus().version.number}}-{{getApiStatus().version.type}}.{{getApiStatus().version.build}}</strong>
          </Badge>
        </div>
      </template>
    </DesktopTitlebar>
    <DesktopRootView class="zyneon-desktop-view">
      <template #left>
       <DesktopSideMenu id="navigation" class="desktop-side-menu">
         <template #top>
           <a class="btn" @mousedown.stop @click="ZyneonSettings.toggleMenuExpanded">
             <i class="icon-text-align-justify"></i>
             <span>{{ t('menu.toggle') }}</span>
           </a>
         </template>
         <template #center>
           <router-link to="/" id="dashboard-button" class="btn" active-class="active" @mousedown.stop>
             <i class="icon-gallery-vertical-end"></i>
             <span>{{ t('menu.dashboard') }}</span>
           </router-link>
           <router-link to="/discover" id="discover-button" class="btn" active-class="active" @mousedown.stop>
             <i class="icon-search"></i>
             <span>{{ t('menu.discover') }}</span>
           </router-link>
           <router-link to="/library" id="library-button" class="btn" active-class="active" @mousedown.stop>
             <i class="icon-library"></i>
             <span>{{ t('menu.library') }}</span>
           </router-link>
           <!--router-link to="/tools" id="library-button" class="btn" active-class="active" @mousedown.stop>
             <i class="icon-wrench"></i>
             <span>{{ t('menu.tools') }}</span>
           </router-link-->
         </template>
         <template #bottom>
           <a class="btn hover:background-color-blue-400" onclick="window.location.reload();" @mousedown.stop>
             <i class="icon-rotate-cw"></i>
             <span>{{ t('menu.reload') }}</span>
           </a>
           <router-link to="/error" class="btn disabled" @mousedown.stop>
             <i class="icon-bell"></i>
             <span>{{ t('menu.notifications') }}</span>
           </router-link>
           <hr class="opacity-20 mb-2" @mousedown.stop>
           <router-link to="/downloads" id="downloads-button" class="btn" active-class="active" @mousedown.stop>
             <i class="icon-download"></i>
             <span>{{ t('menu.downloads') }}</span>
           </router-link>
           <router-link to="/settings" id="settings-button" class="btn" active-class="active" @mousedown.stop>
             <i class="icon-bolt"></i>
             <span>{{ t('menu.settings') }}</span>
           </router-link>
         </template>
       </DesktopSideMenu>
      </template>
      <template #center>
        <DesktopPane class="zyneon-desktop-content zyn-shadow-xl">
          <div class="zyneon-desktop-content-background" />
          <div class="zyneon-desktop-content-pages">
            <router-view />
          </div>
        </DesktopPane>
      </template>
    </DesktopRootView>
  </div>
</template>

<style scoped>
  .zyneon-desktop {
    position: absolute;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;

    .zyneon-desktop-view {

      .zyneon-desktop-content {
        background: var(--zyn-background);
        border-top-left-radius: var(--zyn-br-lg);
        width: 100%;
        border-top: 1px solid var(--zyn-ov-brighter-200);
        border-left: 1px solid var(--zyn-ov-brighter-200);
        position: relative;
        overflow: hidden;

        .zyneon-desktop-content-pages {
          position: absolute;
          height: 100%;
          width: 100%;
          overflow: hidden;
          overflow-y: auto;
          z-index: 2;
        }

        .zyneon-desktop-content-background {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 1;
          background: var(--zyn-background-app);
          overflow: hidden;
        }

        .zyneon-desktop-content-background::after {
          content: "";
          position: absolute;
          z-index: 0;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--zyn-background-body);
          opacity: 0.5;
        }
      }
    }
  }
</style>
