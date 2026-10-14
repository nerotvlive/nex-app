<script setup lang="ts">
  import DesktopTitlebar from "../components/shared/DesktopTitlebar.vue";
  import DesktopRootView from "../components/shared/DesktopRootView.vue";
  import DesktopPane from "../components/shared/DesktopPane.vue";
  import DesktopSideMenu from "../components/shared/DesktopSideMenu.vue";
  import Badge from "../components/shared/desktopelements/Badge.vue";
  import { onMounted } from 'vue'
  import {ZyneonSettings} from "../assets/zyneon/scripts";
  import {getApiStatus} from "../assets/zyneon/scripts";
  import {useI18n} from "vue-i18n";

  const { t } = useI18n();

  onMounted(() => {
    ZyneonSettings.setClassicMenu(ZyneonSettings.useClassicMenu);
    ZyneonSettings.setBackgroundColor(ZyneonSettings.getBackgroundColor());
    ZyneonSettings.setBackgroundAccent(ZyneonSettings.getBackgroundAccent());
    ZyneonSettings.setRoundedCorners(false,ZyneonSettings.getRoundedCorners());
    ZyneonSettings.setBackgroundAccentOpacity(false,ZyneonSettings.getBackgroundAccentOpacity());
    ZyneonSettings.setSecondaryFrame(false);

    ZyneonSettings.setCanReloadMain(true);
  })

</script>

<template>
  <div class="zyneon-desktop zyn-background-body" id="main">
    <DesktopTitlebar class="zyneon-desktop-titlebar" id="titlebar" :class="ZyneonSettings.isBorderless ? '' : 'hidden'">
      <template #start>
        <div class="w-full h-full gap-2 flex justify-start items-center">
          <img alt="" class="z-n1 h-4 ml-3" src="../assets/zyneon/img/nex-app-title.png">
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
       <DesktopSideMenu id="navigation" class="desktop-side-menu flex-col" :class="ZyneonSettings.isBorderless ? 'rounded-border' : ''">
         <template #top>
           <a class="zyn-btn compact transparent" @mousedown.stop @click="ZyneonSettings.toggleMenuExpanded">
             <i class="icon-text-align-justify"></i>
             <span class="grow">{{ t('menu.toggle') }}</span>
           </a>
         </template>
         <template #center>
           <div class="flex flex-col">
             <router-link to="/" id="dashboard-button" class="zyn-btn compact transparent" active-class="active" @mousedown.stop>
               <i class="icon-gallery-vertical-end"></i>
               <span class="grow">{{ t('menu.dashboard') }}</span>
             </router-link>
             <router-link to="/discover" id="discover-button" class="zyn-btn compact transparent" active-class="active" @mousedown.stop>
               <i class="icon-search"></i>
               <span class="grow">{{ t('menu.discover') }}</span>
             </router-link>
             <router-link to="/library" id="library-button" class="zyn-btn compact transparent" active-class="active" @mousedown.stop>
               <i class="icon-library"></i>
               <span class="grow">{{ t('menu.library') }}</span>
             </router-link>
             <router-link to="/tools" id="library-button" class="zyn-btn compact transparent" active-class="active" @mousedown.stop>
               <i class="icon-wrench"></i>
               <span class="grow">{{ t('menu.tools') }}</span>
             </router-link>
           </div>
         </template>
         <template #bottom>
           <a class="zyn-btn compact transparent" :class="ZyneonSettings.isDev ? '' : 'hidden'" onclick="window.location.reload();" @mousedown.stop>
             <i class="icon-rotate-cw"></i>
             <span class="grow">{{ t('menu.reload') }}</span>
           </a>
           <router-link to="/notifications" class="zyn-btn compact transparent disabled" @mousedown.stop>
             <i class="icon-bell"></i>
             <span class="grow">{{ t('menu.notifications') }}</span>
           </router-link>
           <hr class="opacity-20 mb-2" @mousedown.stop>
           <router-link to="/downloads" id="downloads-button" class="zyn-btn compact transparent" active-class="active" @mousedown.stop>
             <i class="icon-download"></i>
             <span class="grow">{{ t('menu.downloads') }}</span>
           </router-link>
           <router-link to="/settings" id="settings-button" class="zyn-btn compact transparent" active-class="active" @mousedown.stop>
             <i class="icon-bolt"></i>
             <span class="grow">{{ t('menu.settings') }}</span>
           </router-link>
         </template>
       </DesktopSideMenu>
      </template>
      <template #center>
        <DesktopPane class="zyneon-desktop-content" :class="ZyneonSettings.isBorderless ? 'rounded-border' : ''">
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
  body {
    .zyneon-desktop {
      position: absolute;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;

      .zyneon-desktop-view {

        .desktop-side-menu {
          height: 100vh;
          padding-top: 0.5rem;
        }

        .desktop-side-menu.rounded-border {
          height: 100%;
          padding-top: 0;
        }

        .zyneon-desktop-content {
          background: var(--zyn-background);
          width: 100%;
          height: 100vh;
          border-left: 1px solid var(--zyn-ov-brighter-200);
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 1rem #00000075;

          .zyneon-desktop-content-pages {
            transform: translateX(100%);
            position: absolute;
            height: 100%;
            width: 100%;
            overflow: hidden;
            overflow-y: auto;
            z-index: 2;
            animation: comeInRight 0.5s ease-in-out forwards;
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

        .zyneon-desktop-content.rounded-border {
          border-top-left-radius: var(--zyn-br-lg);
          border-top: 1px solid var(--zyn-ov-brighter-200);
          height: 100%;
        }
      }
    }
  }

  body.classic-menu {
    .zyneon-desktop {
      .zyneon-desktop-view {
        .zyneon-desktop-content {
          box-shadow: inset 0.334rem 0.334rem 0.75rem black;
        }
      }
    }
  }
</style>
