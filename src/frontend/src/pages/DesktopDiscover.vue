<script setup lang="ts">
import '../assets/zyneon/css/discover.css';
import {onMounted} from "vue";
import {ZyneonSettings} from "../assets/zyneon/scripts";
import {useI18n} from "vue-i18n";
import Badge from "../components/shared/desktopelements/Badge.vue";
import ImmersiveHeader from "../components/shared/desktopelements/ImmersiveHeader.vue";
const { t } = useI18n();

onMounted(()=>{
  ZyneonSettings.setMenuExpanded(false);
})
</script>

<template>
  <div class="w-full h-full">
    <div class="background min-h-full max-h-full w-full"></div>
    <div class="h-full p-3 w-full backdrop-blur-lg">
      <ImmersiveHeader>
        <template #title>{{ t("pages.discover.title") }}</template>
        <template #top-left>
          <span>
            <span class="text-lg text-nowrap">
              title<br>
            </span>
            <span class="text-md opacity-50">
              subtitle
            </span>
          </span>
        </template>
        <template #top-right>
          <Badge background="var(--color-green-400)" class="text-black shadow-lg shadow-black/25">
            <strong class="text-xs sm:text-sm md:text-md lg:text-lg">
              SOURCE
            </strong>
          </Badge>
        </template>
        <template #bottom-left>
          <div class="flex gap-2 mt-8 text-md xl:text-lg">
            <button class="zyn-btn compact">
              <i class="bi bi-globe hidden lg:inline"></i>
              button
            </button>
          </div>
        </template>
        <template #bottom-right>
          <a class="absolute bottom-0 text-md xl:text-lg">
            <button class="zyn-btn compact transparent">
              <i class="bi bi-caret-down-fill text-white"></i>
            </button>
          </a>
        </template>
      </ImmersiveHeader>
      <div class="py-3">

      </div>
    </div>
  </div>
</template>

<style>
.background {
  position: absolute;
  z-index: -1;
  background: url("../assets/zyneon/img/background.jpg") center;
  background-size: cover;
  -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%);
  mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%);
}
</style>