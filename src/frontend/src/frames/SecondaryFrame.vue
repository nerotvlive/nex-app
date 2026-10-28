<script setup lang="ts">
import DesktopTitlebar from "../components/shared/DesktopTitlebar.vue";
import { onMounted } from 'vue'
import {WindowControls, ZyneonSettings} from "../assets/zyneon/scripts";
import {useI18n} from "vue-i18n";

const { t } = useI18n();


onMounted(() => {
  ZyneonSettings.setClassicMenu(ZyneonSettings.useClassicMenu);
  ZyneonSettings.setBackgroundColor(ZyneonSettings.getBackgroundColor());
  ZyneonSettings.setBackgroundAccent(ZyneonSettings.getBackgroundAccent());
  ZyneonSettings.setRoundedCorners(false,ZyneonSettings.getRoundedCorners());
  ZyneonSettings.setBackgroundAccentOpacity(false,ZyneonSettings.getBackgroundAccentOpacity());
  ZyneonSettings.setSecondaryFrame(true);
  ZyneonSettings.setCanReloadMain(true);
})

const back = () => {
  WindowControls.openMain();
  WindowControls.close();
}
</script>

<template>
  <div class="zyneon-desktop zyn-background-body" id="main">
    <DesktopTitlebar class="zyneon-desktop-titlebar" id="titlebar">
      <template #start>
        <span class="p-3 text-white">NEX App</span>
      </template>
      <template #title>
        <div/>
      </template>
      <template #additional-buttons>
        <button type="button" style="padding: 0 0.75rem 0 0.7rem;" @click="back" id="titlebar-replay-intro"><i class="bi bi-caret-left-fill mr-1"></i> {{ t('titlebar.back') }}</button>
      </template>
    </DesktopTitlebar>
    <div class="w-full h-full overflow-hidden overflow-y-auto">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
body {
  .zyneon-desktop-titlebar {
    background: #0005;

    .titlebar-back-button {
      height: 40px;
      padding: 0 1rem;
    }

    .titlebar-back-button:hover {
      background: var(--zyn-background-brighter);
    }
  }

  .zyneon-desktop {
    position: absolute;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }
}

body.classic-menu {
  .zyneon-desktop-titlebar {
    background: black;
  }

  .zyneon-desktop {
    background: var(--zyn-background-app) !important;
  }
}
</style>
