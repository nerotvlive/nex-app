<script setup lang="ts">
import '../assets/zyneon/css/tools.css';
import {onMounted, ref} from "vue";
import {WindowControls, ZyneonSettings} from "../assets/zyneon/scripts";
import {useI18n} from "vue-i18n";
import CardStructured from "../components/shared/desktopelements/CardStructured.vue";
const { t } = useI18n();

const secondarySelect = ref<HTMLSelectElement | null>(null);

const launchSecondary = () => {
  const path = secondarySelect.value?.value || "/";
  WindowControls.openSecondaryFrame(path);
}

onMounted(()=>{
  ZyneonSettings.setMenuExpanded(false);
  if (secondarySelect.value) {
    secondarySelect.value.value = "/settings";
  }
})
</script>

<template>
  <div class="w-full h-full p-3">
    <h1 class="text-2xl font-bold mb-2">{{ t("pages.tools.title") }}</h1>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(333px,1fr))] gap-3">
      <CardStructured background="var(--zyn-ov-brighter-100)" border="1px solid var(--zyn-ov-brighter-200)">
        <template #header>
          <strong class="text-white">{{ t('pages.tools.secondary.title') }}</strong>
        </template>
        <template #content>
          {{ t('pages.tools.secondary.description') }}<br>
        </template>
        <template #footer>
          <div class="flex flex-wrap gap-2 mb-1 h-full flex-1 items-end">
            <select ref="secondarySelect" class="zyn-btn">
              <option class="bg-black text-white" value="/">/</option>
              <option class="bg-black text-white" value="/library">{{ t('menu.library') }}</option>
              <option class="bg-black text-white" value="/tools">{{ t('menu.tools') }}</option>
              <option class="bg-black text-white" value="/notifications">{{ t('menu.notifications') }}</option>
              <option class="bg-black text-white" value="/downloads">{{ t('menu.downloads') }}</option>
              <option class="bg-black text-white" value="/settings">{{ t('menu.settings') }}</option>
            </select>
            <a @click="launchSecondary" class="zyn-btn">
              <i class="bi bi-play"/>
              {{ t('pages.tools.secondary.launch') }}
            </a>
          </div>
        </template>
      </CardStructured>
      <CardStructured background="var(--zyn-ov-brighter-100)" border="1px solid var(--zyn-ov-brighter-200)">
        <template #header>
          <strong class="text-white">{{ t('pages.tools.controls.title') }}</strong>
        </template>
        <template #content>
          {{ t('pages.tools.controls.description') }}<br>
        </template>
        <template #footer>
          <div class="flex flex-wrap gap-2 mb-1 h-full flex-1 items-end">
            <a @click="WindowControls.reload" class="zyn-btn">
              <i class="bi bi-play"/>
              {{ t('pages.tools.controls.reload') }}
            </a>
            <a @click="WindowControls.restart" class="zyn-btn">
              <i class="bi bi-play"/>
              {{ t('pages.tools.controls.restart') }}
            </a>
            <button @click="WindowControls.toggleNative" class="zyn-btn">
              <i class="bi bi-play"/>
              {{ t('pages.tools.controls.native') }}
            </button>
          </div>
        </template>
      </CardStructured>
    </div>
  </div>
</template>

<style scoped>
button.absolute {
  transition: all 0.2s ease;
}

button.absolute:hover {
  background: var(--zyn-ov-brighter-400);
  cursor: pointer;
}
</style>