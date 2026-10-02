<script setup lang="ts">
import DesktopTitlebar from "../../components/shared/DesktopTitlebar.vue";
import DesktopRootView from "../../components/shared/DesktopRootView.vue";
import DesktopPane from "../../components/shared/DesktopPane.vue";
import DesktopSideMenu from "../../components/shared/DesktopSideMenu.vue";
import { WindowControls } from "../../assets/zyneon/script/windowControls.ts"
import { onMounted } from 'vue'
import SerwiNStart from "./pages/SerwiNStart.vue";

function showPage(page: string) {
  document.getElementById("start")?.classList.remove("active");
  document.getElementById("start-button")?.classList.remove("active");
  document.getElementById(page)?.classList.add("active");
  document.getElementById(page+"-button")?.classList.add("active");
  WindowControls.closeMenu("navigation");
}

document.addEventListener('contextmenu', (e) => {
  e.preventDefault()
})

onMounted(() => {
  showPage("start");
  document.documentElement.style.setProperty("--zyn-background-body", "radial-gradient(circle at bottom right, #180224 0%, var(--zyn-background-color) 90%)");
  document.documentElement.style.setProperty("--zyn-background-color", "#050d1b");
})
</script>

<template>
  <div class="zyneon-desktop zyn-background-body" id="main">
    <DesktopTitlebar class="zyneon-desktop-titlebar" title="Zyneon Desktop" id="titlebar">
      <template #start>
        <div class="w-full h-full gap-2 flex justify-start items-center">
          <img alt="" class="z-n1 h-4 ml-3 hidden" src="../../assets/zyneon/img/nex-app-title.png">
          <span class="ml-3">SerwiN 3.0-alpha.0</span>
          <div class="relative z-1">
            <div class="flex gap-2 items-center">

            </div>
          </div>
        </div>
      </template>
      <template #title>
        <div class="hidden"></div>
      </template>
      <template #end>
        <div class="w-full h-full gap-2 flex justify-end items-center pr-6">

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
            <a id="start-button" class="btn active" @click="showPage('start')" @mousedown.stop>
              <i class="icon-gallery-vertical-end"></i>
              <span>Start</span>
            </a>
          </template>
          <template #bottom>
            <a class="btn hover:background-color-blue-400" onclick="window.location.reload();" @mousedown.stop>
              <i class="icon-rotate-cw"></i>
              <span>Reload (F5/CTRL + R)</span>
            </a>
            <hr class="opacity-20 mb-2">
            <a id="settings-button" class="btn" @mousedown.stop>
              <i class="icon-bolt"></i>
              <span>Settings</span>
            </a>
          </template>
        </DesktopSideMenu>
      </template>
      <template #center>
        <DesktopPane class="zyneon-desktop-content zyn-shadow-xl">
          <SerwiNStart id="start" class="zyneon-desktop-page active"/>
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
      background: var(--zyn-background-app);
      border-top-left-radius: var(--zyn-br-lg);
      width: 100%;
      border-top: 1px solid var(--zyn-ov-brighter-200);
      border-left: 1px solid var(--zyn-ov-brighter-200);
      position: relative;
      overflow: hidden;
      overflow-y: auto;
    }
  }
}
</style>
