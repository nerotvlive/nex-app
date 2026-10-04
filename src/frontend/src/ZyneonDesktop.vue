<script setup lang="ts">
  import DesktopTitlebar from "./components/shared/DesktopTitlebar.vue";
  import DesktopRootView from "./components/shared/DesktopRootView.vue";
  import DesktopPane from "./components/shared/DesktopPane.vue";
  import DesktopSideMenu from "./components/shared/DesktopSideMenu.vue";
  import DesktopDashboard from "./pages/DesktopDashboard.vue";
  import DesktopDiscover from "./pages/DesktopDiscover.vue";
  import DesktopDownloads from "./pages/DesktopDownloads.vue";
  import DesktopLibrary from "./pages/DesktopLibrary.vue";
  import DesktopTools from "./pages/DesktopTools.vue";
  import DesktopSearch from "./pages/DesktopSearch.vue";
  import DesktopSettings from "./pages/DesktopSettings.vue";
  import { WindowControls } from "./assets/zyneon/scripts"
  import Badge from "./components/shared/desktopelements/Badge.vue";
  import { onMounted } from 'vue'
  import {ZyneonSettings} from "./assets/zyneon/scripts";
  import {getApiStatus} from "./assets/zyneon/scripts";

  function showPage(page: string) {
    document.getElementById("dashboard")?.classList.remove("active");
    document.getElementById("discover")?.classList.remove("active");
    document.getElementById("downloads")?.classList.remove("active");
    document.getElementById("library")?.classList.remove("active");
    document.getElementById("tools")?.classList.remove("active");
    document.getElementById("search")?.classList.remove("active");
    document.getElementById("settings")?.classList.remove("active");
    document.getElementById("dashboard-button")?.classList.remove("active");
    document.getElementById("discover-button")?.classList.remove("active");
    document.getElementById("downloads-button")?.classList.remove("active");
    document.getElementById("library-button")?.classList.remove("active");
    document.getElementById("tools-button")?.classList.remove("active");
    document.getElementById("search-button")?.classList.remove("active");
    document.getElementById("settings-button")?.classList.remove("active");
    document.getElementById(page)?.classList.add("active");
    document.getElementById(page+"-button")?.classList.add("active");
    if(page === "dashboard") {
      WindowControls.openMenu("navigation");
    } else {
      WindowControls.closeMenu("navigation");
    }
  }

  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
  })

  onMounted(() => {
    showPage("dashboard");
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
           <a class="btn" onclick="this.parentElement.parentElement.classList.toggle('active')" @mousedown.stop>
             <i class="icon-text-align-justify"></i>
             <span>Toggle menu</span>
           </a>
         </template>
         <template #center>
           <a id="dashboard-button" class="btn active" @click="showPage('dashboard')" @mousedown.stop>
             <i class="icon-gallery-vertical-end"></i>
             <span>Dashboard</span>
           </a>
           <a id="discover-button" class="btn" @click="showPage('discover')" @mousedown.stop>
             <i class="icon-search"></i>
             <span>Discover</span>
           </a>
           <a id="library-button" class="btn" @click="showPage('library')" @mousedown.stop>
             <i class="icon-library"></i>
             <span>Library</span>
           </a>
           <!--a id="tools-button" class="btn" @click="showPage('tools')" @mousedown.stop>
             <i class="icon-wrench"></i>
             <span>Tools & Experiments</span>
           </a-->
         </template>
         <template #bottom>
           <a class="btn hover:background-color-blue-400" onclick="window.location.reload();" @mousedown.stop>
             <i class="icon-rotate-cw"></i>
             <span>Reload (F5/CTRL + R)</span>
           </a>
           <a class="btn disabled" @mousedown.stop>
             <i class="icon-bell"></i>
             <span>Notifications</span>
           </a>
           <hr class="opacity-20 mb-2" @mousedown.stop>
           <a id="downloads-button" class="btn" @click="showPage('downloads')">
             <i class="icon-download"></i>
             <span>Downloads</span>
           </a>
           <a id="settings-button" class="btn" @click="showPage('settings')" @mousedown.stop>
             <i class="icon-bolt"></i>
             <span>Settings</span>
           </a>
         </template>
       </DesktopSideMenu>
      </template>
      <template #center>
        <DesktopPane class="zyneon-desktop-content zyn-shadow-xl">
          <div class="zyneon-desktop-content-background" />
          <div class="zyneon-desktop-content-pages">
            <DesktopDashboard id="dashboard" class="zyneon-desktop-page active" />
            <DesktopDiscover id="discover" class="zyneon-desktop-page" />
            <DesktopDownloads id="downloads" class="zyneon-desktop-page" />
            <DesktopLibrary id="library" class="zyneon-desktop-page" />
            <DesktopTools id="tools" class="zyneon-desktop-page" />
            <DesktopSearch id="search" class="zyneon-desktop-page" />
            <DesktopSettings id="settings" class="zyneon-desktop-page" />
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

        .zyneon-desktop-page {
          display: none;
        }

        .zyneon-desktop-page.active {
          display: block;
        }
      }
    }
  }
</style>
