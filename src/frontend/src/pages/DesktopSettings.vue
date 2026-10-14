<script setup lang="ts">
import '../assets/zyneon/css/settings.css';
import {WindowControls, ZyneonSettings} from "../assets/zyneon/scripts";
import LanguageSwitcher from "../components/shared/desktopelements/LanguageSwitcher.vue";
import {onMounted} from "vue";
import {useI18n} from "vue-i18n";
import DesktopSideMenu from "../components/shared/DesktopSideMenu.vue";
const { t } = useI18n();

const handleRoundedCorners = (isRange: boolean, e: Event) => {
  const target = e.target as HTMLInputElement;
  ZyneonSettings.setRoundedCorners(isRange, parseFloat(target.value));
};

const handleBgAccentOpacity = (isRange: boolean, e: Event) => {
  const target = e.target as HTMLInputElement;
  ZyneonSettings.setBackgroundAccentOpacity(isRange, parseFloat(target.value));
};

const handleBgAccent = (e: Event) => {
  const target = e.target as HTMLInputElement;
  ZyneonSettings.setBackgroundAccent(target.value);
};

const handleBgColor = (e: Event) => {
  const target = e.target as HTMLInputElement;
  ZyneonSettings.setBackgroundColor(target.value);
};

const handleClassicMenu = (e: Event) => {
  const target = e.target as HTMLInputElement;
  ZyneonSettings.setClassicMenu(target.checked);
};

onMounted(()=>{
  ZyneonSettings.setMenuExpanded(false);
})

const resetSettings = () => {
  localStorage.clear();
  WindowControls.reloadAll();
  WindowControls.reload();
}

</script>

<template>
  <div class="flex w-full h-full">
    <DesktopSideMenu class="h-full active small zyn-ov-brighter" style="border-right: 1px solid var(--zyn-ov-brighter-200);">
      <template #top>
        <div class="flex items-center" @mousedown.stop>
          <strong class="zyn-foreground-alt" style="padding: 0.475rem 1rem;">
            {{ t("pages.settings.title") }}
          </strong>
        </div>
      </template>
      <template #center>
        <div class="flex flex-col h-full w-full overflow-hidden overflow-y-auto" @mousedown.stop>
          <a class="zyn-btn compact">
            <i class="bi bi-gear-wide-connected"></i>
            <span class="grow">{{ t("pages.settings.menu.general") }}</span>
          </a>
          <a class="zyn-btn compact">
            <i class="bi bi-palette"></i>
            <span class="grow">{{ t("pages.settings.menu.appearance") }}</span>
          </a>
        </div>
      </template>
      <template #bottom>
        <router-link to="/tools" class="zyn-btn compact" @mousedown.stop>
          <i class="bi bi-wrench"></i>
          <span class="grow">{{ t("menu.tools") }}</span>
        </router-link>
        <div class="flex pt-2" style="margin-right: 0; border-top: 1px solid var(--zyn-ov-brighter-200);" @mousedown.stop>
          <a class="zyn-btn compact max-w-fit" @click="WindowControls.reload(); WindowControls.reloadAll();">
            <i class="bi bi-arrow-clockwise"></i>
          </a>
          <a class="zyn-btn compact hover-danger" style="margin-left: 0;" @click="resetSettings">
            <i class="bi bi-trash"></i>
            <span class="grow">{{ t("pages.settings.reset") }}</span>
          </a>
        </div>
      </template>
    </DesktopSideMenu>
    <div class="w-full p-4 py-2">
      <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md my-2">
        <div class="flex w-full">
          <strong>{{ t("pages.settings.border.radius") }}</strong>
        </div>
        <div class="flex w-full justify-end align-middle items-center">
          <input id="background-rounded-number" type="number" min="0" max="2" step="0.01" :value="ZyneonSettings.getRoundedCorners()" @input="e => handleRoundedCorners(false, e)" />
          <input id="background-rounded-range" type="range" min="0" max="2" step="0.01" :value="ZyneonSettings.getRoundedCorners()" @input="e => handleRoundedCorners(true, e)" />
        </div>
      </div>

      <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md my-2">
        <div class="flex w-full">
          <strong>{{ t("pages.settings.background.accent.opacity") }}</strong>
        </div>
        <div class="flex w-full justify-end align-middle items-center">
          <input id="background-accOp-number" type="number" min="0" max="0.99" step="0.01" :value="ZyneonSettings.getBackgroundAccentOpacity()" @input="e => handleBgAccentOpacity(false, e)" />
          <input id="background-accOp-range" type="range" min="0" max="0.99" step="0.01" :value="ZyneonSettings.getBackgroundAccentOpacity()" @input="e => handleBgAccentOpacity(true, e)" />
        </div>
      </div>

      <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md my-2">
        <div class="flex w-full">
          <strong>{{ t("pages.settings.background.accent.color") }}</strong>
        </div>
        <div class="flex w-full justify-end align-middle items-center">
          <input type="color" class="w-10 h-10 cursor-pointer rounded border-none bg-transparent" :value="ZyneonSettings.getBackgroundAccent()" @input="handleBgAccent" />
        </div>
      </div>

      <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md my-2">
        <div class="flex w-full">
          <strong>{{ t("pages.settings.background.color") }}</strong>
        </div>
        <div class="flex w-full justify-end align-middle items-center">
          <input type="color" class="w-10 h-10 cursor-pointer rounded border-none bg-transparent" :value="ZyneonSettings.getBackgroundColor()" @input="handleBgColor" />
        </div>
      </div>

      <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md my-2" @click="(e) => (e.currentTarget as HTMLElement).querySelector('input')?.click()">
        <div class="flex w-full">
          <strong>{{ t("pages.settings.menu.classic") }}</strong>
        </div>
        <div class="flex w-full justify-end align-middle items-center">
          <input class="pointer-events-none mr-1" type="checkbox" :checked="ZyneonSettings.useClassicMenu" @change="handleClassicMenu" />
        </div>
      </div>

      <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md my-2">
        <div class="flex w-full">
          <strong>{{ t("pages.settings.language.select") }}</strong>
        </div>
        <div class="flex w-full justify-end align-middle items-center">
          <LanguageSwitcher/>
        </div>
      </div>
    </div>
  </div>
</template>