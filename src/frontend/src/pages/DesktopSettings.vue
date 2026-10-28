<script setup lang="ts">
import '../assets/zyneon/css/settings.css';
import {WindowControls, ZyneonSettings} from "../assets/zyneon/scripts";
import {onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import DesktopSideMenu from "../components/shared/DesktopSideMenu.vue";
import DesktopTools from "./DesktopTools.vue";
import DesktopIndex from "./DesktopIndex.vue";
import ErrorReport from "./errors/ErrorReport.vue";
const { t } = useI18n();

const view = ref("general");

const resetSettings = () => {
  localStorage.clear();
  WindowControls.reloadAll();
  window.location.href = "/?intro=skip&skip=true";
}

onMounted(()=>{
  ZyneonSettings.setMenuExpanded(localStorage.getItem("nexapp.neo.settings.view.menu") === "true");
  const header = document.querySelector('.settings-menu');
  if(header) {
    header.classList.add('animates');
    header.classList.add('active');
  }
})
</script>

<template>
  <div class="flex w-full h-full">
    <DesktopSideMenu class="h-full settings-menu small zyn-ov-brighter" style="border-right: 1px solid var(--zyn-ov-brighter-200);">
      <template #top>
        <div class="flex items-center" @mousedown.stop>
          <strong class="zyn-foreground-alt" style="padding: 0.475rem 1rem;">
            {{ t("pages.settings.title") }}
          </strong>
        </div>
      </template>
      <template #center>
        <div class="flex flex-col h-full w-full pt-2 overflow-hidden overflow-y-auto" @mousedown.stop>
          <a class="zyn-btn compact" :class="view === 'general' ? 'active-alt' : ' '" @click="view = 'general'">
            <i class="bi bi-gear-wide-connected"></i>
            <span class="grow">{{ t("pages.settings.menu.general") }}</span>
          </a>
          <a class="zyn-btn compact" :class="view === 'appearance' ? 'active-alt' : ' '" @click="view = 'appearance'">
            <i class="bi bi-palette"></i>
            <span class="grow">{{ t("pages.settings.menu.appearance") }}</span>
          </a>
          <a class="zyn-btn compact" :class="view === 'experimental' ? 'active-alt' : ' '" @click="view = 'experimental'">
            <i class="bi bi-wrench"></i>
            <span class="grow">{{ t("menu.tools") }}</span>
          </a>
        </div>
      </template>
      <template #bottom>
        <div class="pt-2" @mousedown.stop>
          <a class="zyn-btn compact" :class="view === 'report' ? 'active-alt' : ''" @click="view = 'report'">
            <i class="bi bi-bug"></i>
            <span class="grow">{{ t("pages.settings.report") }}</span>
          </a>
          <a class="zyn-btn compact" :class="view === 'setup' ? 'active-alt' : ''" @click="view = 'setup'">
            <i class="bi bi-wrench-adjustable"></i>
            <span class="grow">{{ t("menu.setup") }}</span>
          </a>
          <a class="zyn-btn compact hover-danger" @click="resetSettings">
            <i class="bi bi-trash"></i>
            <span class="grow">{{ t("pages.settings.reset") }}</span>
          </a>
          <div class="flex pt-2" style="margin-right: 0; border-top: 1px solid var(--zyn-ov-brighter-200);">
            <a class="zyn-btn compact" @click="WindowControls.reloadAll(); WindowControls.reload();">
              <i class="bi bi-arrow-clockwise"></i>
              <span class="grow">{{ t("pages.settings.reload") }}</span>
            </a>
            <a class="zyn-btn compact hover-danger" style="margin-left: 0;" @click="WindowControls.restart">
              <i class="bi bi-arrow-clockwise"></i>
              <span class="grow">{{ t("pages.settings.restart") }}</span>
            </a>
          </div>
        </div>
      </template>
    </DesktopSideMenu>
    <div class="flex flex-col w-full p-3 py-2 overflow-hidden overflow-y-auto relative">
      <div class="general-settings grow" :class="view === 'general' ? 'active' : 'hidden'">

      </div>
      <div class="appearance-settings grow" :class="view === 'appearance' ? 'active' : 'hidden'">

      </div>
      <div class="experimental-settings grow" :class="view === 'experimental' ? 'active' : 'hidden'">
        <DesktopTools></DesktopTools>
      </div>
      <div class="setup-settings grow overflow-hidden relative border zyn-br-lg shadow-lg shadow-black/50" style="border-color: var(--zyn-ov-brighter-200);" :class="view === 'setup' ? 'active' : 'hidden'">
        <DesktopIndex></DesktopIndex>
      </div>
      <div class="setup-settings grow overflow-hidden relative border zyn-br-lg shadow-lg shadow-black/50" style="border-color: var(--zyn-ov-brighter-200);" :class="view === 'report' ? 'active' : 'hidden'">
        <ErrorReport></ErrorReport>
      </div>
    </div>
  </div>
</template>