<script setup lang="ts">
import '../assets/zyneon/css/library.css';
import {onMounted} from "vue";
import {WindowControls, ZyneonSettings} from "../assets/zyneon/scripts";
import {useI18n} from "vue-i18n";
const { t } = useI18n();
import DesktopSideMenu from "../components/shared/DesktopSideMenu.vue";

onMounted(()=>{
  ZyneonSettings.setMenuExpanded(localStorage.getItem("nexapp.neo.settings.view.menu") === "true");
  const header = document.querySelector('.library-menu');
  if(header) {
    header.classList.add('animates');
    header.classList.add('active');
  }
})
</script>

<template>
  <div class="flex w-full h-full">
    <DesktopSideMenu class="h-full library-menu small zyn-ov-brighter" style="border-right: 1px solid var(--zyn-ov-brighter-200);">
      <template #top>
        <div class="flex items-center" @mousedown.stop>
          <strong class="zyn-foreground-alt" style="padding: 0.475rem 1rem;">
            {{ t("pages.library.title") }}
          </strong>
          <div class="flex items-center justify-end w-full">
            <button class="zyn-ov-brighter-200 zyn-foreground-alt cursor-pointer px-2 rounded-tl-lg rounded-bl-lg">
              <i class="bi bi-house"></i>
            </button>
            <button class="zyn-ov-brighter-100 zyn-foreground cursor-pointer px-2 mr-2 rounded-tr-lg rounded-br-lg">
              <i class="bi bi-grid"></i>
            </button>
          </div>
        </div>
      </template>
      <template #center>
        <div class="flex gap-1" @mousedown.stop>
          <a class="zyn-btn darker compact w-full" style="margin-right: 0;">
            <i class="bi bi-plus-lg"></i>
            <span class="grow">{{ t("pages.library.menu.add") }}</span>
          </a>
          <a class="zyn-btn darker compact" style="width: fit-content; margin-left: 0; padding: 0 0.667rem" @click="WindowControls.reload">
            <i class="bi bi-arrow-clockwise"></i>
          </a>
        </div>
        <div class="px-2 pb-2" style="border-bottom: 1px solid var(--zyn-ov-brighter-200);" @mousedown.stop>
          <input type="text" class="zyn-btn darker compact outline-none w-full" :placeholder="t('pages.library.menu.search')">
        </div>
        <div class="flex flex-col h-full w-full overflow-hidden overflow-y-auto" @mousedown.stop>

        </div>
      </template>
      <template #bottom>
        <div style="border-top: 1px solid var(--zyn-ov-brighter-200);" @mousedown.stop>
          -
        </div>
      </template>
    </DesktopSideMenu>
    <div class="library-content w-full overflow-hidden overflow-y-auto">

    </div>
  </div>
</template>