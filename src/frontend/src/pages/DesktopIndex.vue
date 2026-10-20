<script setup lang="ts">
import {useLang, WindowControls} from "../assets/zyneon/scripts";
import {useRoute, useRouter} from "vue-router";
import DesktopTitlebarButtons from "../components/shared/DesktopTitlebarButtons.vue";
import {useI18n} from "vue-i18n";
import CardStructured from "../components/shared/desktopelements/CardStructured.vue";
import {computed, nextTick, onMounted} from "vue";
import LanguageSwitcher from "../components/shared/desktopelements/LanguageSwitcher.vue";

const urlParams = new URLSearchParams(window.location.search);
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const { setLang } = useLang()

const start = async () => {
  localStorage.setItem("nexapp.neo.settings.setup.finished","true")
  await nextTick();

  if(localStorage.getItem("nexapp.neo.settings.setup.finished") === "true") {
    if(!localStorage.getItem("nexapp.neo.settings.general.startpage")) {
      localStorage.setItem("nexapp.neo.settings.general.startpage","/dashboard");
      await nextTick();
    }
    if(localStorage.getItem("nexapp.neo.settings.general.startpage")) {
      const startPage = localStorage.getItem("nexapp.neo.settings.general.startpage");
      if(startPage) {
        window.location.href = startPage
        return;
      }
    }
  }
  await start();
}

const restart = async () => {
  localStorage.clear();
  await WindowControls.reloadAll();
  window.location.href = "/intro";
}

const withControls = computed(() => {
  return (route.path === '/');
});

const isEnglish = computed(() => {
  return t("languages.auto.key") === "en";
})

const isFirstSetup = window.location.pathname === "/";

onMounted(() => {
  if (localStorage.getItem("nexapp.neo.settings.setup.finished") === "true") {
    if(isFirstSetup) {
      start();
    }
  } else if (urlParams.get("intro") !== "skip") {
    restart();
  }
});
</script>

<template>
  <div class="main" @mousedown="WindowControls.startDrag()">
    <DesktopTitlebarButtons class="absolute z-10 controls" @mousedown.stop :class="{ 'hidden': !withControls }">
      <template #additional-buttons>
        <button type="button" style="padding: 0 1rem;" @click="router.push('/intro')" id="titlebar-replay-intro"><i class="bi-arrow-clockwise mr-2"></i> {{ t('pages.start.intro.replay') }}</button>
      </template>
    </DesktopTitlebarButtons>
    <div class="northern-aurora absolute inset-0 z-0 pointer-events-none" :class="isFirstSetup ? '' : 'hidden'" />
    <div class="z-1 overflow-hidden overflow-y-auto w-full content">
      <CardStructured @mousedown.stop>
        <template #header>
          <strong class="text-xl text-white">
            {{ t('pages.start.setup.title') }}
          </strong>
        </template>
        <template #content>
          <p class="text-white">{{ t('pages.start.setup.description') }}</p>
          <div class="flex flex-col gap-2">
            <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md my-2">
              <div class="flex w-full">
                <strong>{{ t("pages.settings.language.select") }}</strong>
              </div>
              <div class="flex w-full justify-end align-middle items-center">
                <LanguageSwitcher/>
              </div>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex w-full justify-between">
            <div class="flex gap-1">
              <button @click="setLang('en'); router.push('/intro');" class="zyn-btn compact" :class="{ 'hidden': isEnglish }">Use English</button>
              <button @click="start()" class="zyn-btn hover-warning-alt compact opacity-50 hover:opacity-100 transition-all" :class="{ 'hidden': !withControls }">{{ t('pages.start.setup.skip') }}</button>
              <button @click="restart()" class="zyn-btn hover-danger-alt compact opacity-50 hover:opacity-100 transition-all" :class="{ 'hidden': withControls }">{{ t('pages.start.setup.restart') }}</button>
            </div>
            <button @click="start()" class="zyn-btn compact">{{ t('pages.start.setup.continue') }}</button>
          </div>
        </template>
      </CardStructured>
    </div>
  </div>
</template>

<style scoped>
.main {
  position: absolute;
  top: 0; left: 0; bottom: 0; right: 0;
  overflow: hidden;
  padding: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  .controls {
    animation: fadeIn 2s ease-in-out forwards;
  }

  .content {
    height: 100%;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    display: flex;
    opacity: 0;
    animation: fadeIn 1s ease-in-out forwards;

    .hidden {
      display: none !important;
    }
  }

  .northern-aurora {
    opacity: 0.75;
    background: center
    radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255, 20, 147, 0.15), transparent 50%),
    radial-gradient(ellipse 160% 130% at 10% 10%, rgba(0, 255, 255, 0.12), transparent 60%),
    radial-gradient(ellipse 160% 130% at 90% 90%, rgba(138, 43, 226, 0.18), transparent 65%),
    radial-gradient(ellipse 110% 50% at 80% 30%, rgba(255, 215, 0, 0.08), transparent 40%),
    #000000;
  }
}
</style>