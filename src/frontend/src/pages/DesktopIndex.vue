<script setup lang="ts">
import {useLang, WindowControls} from "../assets/zyneon/scripts";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import CardStructured from "../components/shared/desktopelements/CardStructured.vue";
import {computed, nextTick, onMounted} from "vue";
import LanguageSwitcher from "../components/shared/desktopelements/LanguageSwitcher.vue";
import DesktopTitlebar from "../components/shared/DesktopTitlebar.vue";
import DesktopSideMenu from "../components/shared/DesktopSideMenu.vue";

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

let withControls = (route.path === '/');

const isEnglish = computed(() => {
  return t("languages.auto.key") === "en";
})

const isFirstSetup = window.location.pathname === "/";

const transformTitlebar = () => {
  if(!withControls) return;
  const tb = document.getElementById("tb-div");
  tb?.classList.remove("hidden");
  tb?.classList.add("comeInTop");
  const main = document.querySelector(".main");
  main?.classList.add("withTitlebar");
  const mn = document.getElementById("mn-div");
  mn?.classList.remove("disabled");
}

const update = () => {
  const setupCard = document.querySelector(".setup-card")
  if(setupCard) {
    const english = setupCard.querySelector(".english-button");
    english?.remove();
    const back = setupCard.querySelector(".back-button") as HTMLElement | null;
    back?.classList.remove("hidden");
    if(back) {
      back.onclick = () => {
        window.location.reload();
      }
    }
  }
}

const appearance = () => {
  update()
  transformTitlebar();
  const setupCard = document.querySelector(".setup-card");
  if(setupCard) {
    const title = setupCard.querySelector(".title");
    const description = setupCard.querySelector(".description");
    const languageDeco = document.querySelector(".deco-language");
    const appearanceDeco = document.querySelector(".deco-appearance");
    const content = setupCard.querySelector(".card-content") as HTMLElement | null;
    if (title) {
      title.textContent = t('pages.start.setup.title') + " » " + t('pages.start.setup.appearance.title');
    }
    if(description) {
      description.textContent = t('pages.start.setup.appearance.description');
    }
    if(content) {
      content.innerHTML = "";
    }
    if(appearanceDeco) {
      appearanceDeco.classList.add("comeIn");
      appearanceDeco.classList.remove("out");
    }
    if(languageDeco) {
      languageDeco.classList.remove("comeIn");
      languageDeco.classList.add("fallOff");
    }

    next = () => {
      start();
    }
  }
}

let next = () => {
  appearance();
}

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
  <div class="flex flex-col h-full root">
    <div class="absolute top-0 left-0 w-full h-full gradient"/>
    <div class="titlebar-container hidden w-full h-[40px]" id="tb-div">
      <DesktopTitlebar class="absolute z-10 controls" @mousedown.stop :class="{ 'hidden': !withControls }">
        <template #title>
          <div/>
        </template>
        <template #additional-buttons>
          <button type="button" style="padding: 0 1rem;" @click="router.push('/intro')" id="titlebar-replay-intro"><i class="bi-arrow-clockwise mr-2"></i> {{ t('pages.start.intro.replay') }}</button>
        </template>
      </DesktopTitlebar>
    </div>
    <div class="flex h-full w-full">
      <DesktopSideMenu id="mn-div" class="disabled">
        <template #top>
          <a class="zyn-btn compact transparent" @mousedown.stop onclick="this.parentNode.parentNode.classList.toggle('active')">
            <i class="icon-text-align-justify"></i>
            <span class="grow">{{ t('menu.toggle') }}</span>
          </a>
        </template>
        <template #center>
          <div class="flex flex-col">

          </div>
        </template>
        <template #bottom>

        </template>
      </DesktopSideMenu>
      <div class="main h-full w-full" @mousedown="WindowControls.startDrag()">
        <div class="animated-border"></div>
        <div class="animated-border-left"></div>
        <div class="animated-border-top"></div>
        <div class="animated-border-bottom"></div>
        <div class="northern-aurora absolute inset-0 z-0 pointer-events-none" :class="isFirstSetup ? '' : 'hidden'" />
        <div class="text-7xl font-bold flex flex-col uppercase opacity-50 zyn-text-accent-alt z-0 deco">
          <span class="absolute rotated out deco-appearance">{{ t('pages.start.setup.appearance.title') }}</span>
          <span class="absolute rotated comeIn deco-language">{{ t('pages.start.setup.language.title') }}</span>
          <span class="absolute rotated fallOff deco-setup">{{ t('pages.start.setup.title') }}</span>
        </div>
        <div class="z-1 overflow-hidden overflow-y-auto w-full content">
          <CardStructured @mousedown.stop class="min-w-[32rem] z-10 setup-card">
            <template #header>
              <strong class="text-xl text-white title">
                {{ t('pages.start.setup.title') }} » {{ t('pages.start.setup.language.title') }}
              </strong>
            </template>
            <template #content>
              <p class="text-white description">{{ t('pages.start.setup.language.description') }}</p>
              <div class="flex flex-col gap-2 card-content">
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
                  <button @click="setLang('en'); router.push('/intro');" class="zyn-btn compact english-button" :class="{ 'hidden': isEnglish }">Use English</button>
                  <button @click="start()" class="zyn-btn hover-warning-alt compact opacity-50 hover:opacity-100 transition-all" :class="{ 'hidden': !withControls }">{{ t('pages.start.setup.skip') }}</button>
                  <button @click="restart()" class="zyn-btn hover-danger-alt compact opacity-50 hover:opacity-100 transition-all" :class="{ 'hidden': withControls }">{{ t('pages.start.setup.restart') }}</button>
                </div>
                <div class="flex gap-1">
                  <button class="zyn-btn compact back-button hidden"><i class="bi-arrow-left"></i></button>
                  <button @click="next();" class="zyn-btn compact">{{ t('pages.start.setup.continue') }}</button>
                </div>
              </div>
            </template>
          </CardStructured>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
body {
  .root {
    background: var(--zyn-background);

    .gradient {
      background: var(--zyn-background-body);
      opacity: 0.5;
    }
  }
}

.main {
  height: calc(100%);
  position: relative;
  overflow: hidden;
  padding: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  box-shadow: 0 0 1rem transparent;
  transition: all 1.5s ease;
  background: var(--zyn-background-app);

  .controls {
    animation: fadeIn 2s ease-in-out forwards;
  }

  .deco {
    animation: fadeInDeco 2s ease-in-out forwards;

    .rotated {
      position: absolute;
      left: 5rem;
      bottom: 1rem;
      transform-origin: bottom left;
      transform: rotate(-90deg) translateY(0);
    }

    .rotated.comeIn {
      transform: rotate(-90deg) translateY(-5rem);
      animation: comeIn 2s ease-in-out forwards;
    }

    .rotated.out {
      transform: rotate(-90deg) translateY(-5rem);
      animation: none;
    }

    .rotated.fallOff {
      animation: fallOff 2s ease-in-out forwards;
    }
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
    opacity: 1;
    background: center
    radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255, 20, 147, 0.15), transparent 50%),
    radial-gradient(ellipse 160% 130% at 10% 10%, rgba(0, 255, 255, 0.12), transparent 60%),
    radial-gradient(ellipse 160% 130% at 90% 90%, rgba(138, 43, 226, 0.18), transparent 65%),
    radial-gradient(ellipse 110% 50% at 80% 30%, rgba(255, 215, 0, 0.08), transparent 40%),
    #090909;
  }
}

.titlebar-container.comeInTop {
  position: relative;
  animation: comeInTop 0.5s ease forwards;
}

.main.withTitlebar {
  box-shadow: 0 0 1rem #00000075;
  border-left: 1px solid transparent;
  border-top: 1px solid transparent;
  animation: corner 4s ease-in-out forwards;

  .animated-border, .animated-border-left {
    position: absolute;
    z-index: 1;
    height: 1px;
    top: 0;
    right: 0;
    background: var(--zyn-ov-brighter-200);
    width: 1%;
    animation: border 4s ease-in-out forwards;
  }

  .animated-border-left {
    left: 0;
  }

  .animated-border-top, .animated-border-bottom {
    position: absolute;
    z-index: 1;
    width: 1px;
    top: 1px;
    left: 0;
    background: var(--zyn-ov-brighter-200);
    height: 1%;
    animation: borderHeight 4s ease-in-out forwards;
  }

  .animated-border-bottom {
    top: unset;
    bottom: 0;
  }
}

@keyframes border {
  0% {
    width: 0;
    background: var(--zyn-ov-brighter-500);
  }

  50% {
    width: 100%;
    background: var(--zyn-ov-brighter-100);
  }

  75% {
    width: 100%;
    background: var(--zyn-ov-brighter-100);
  }

  100% {
    width: 100%;
    background: transparent;
  }
}

@keyframes corner {
  0%,50% {
    border-left: 1px solid transparent;
    border-top: 1px solid transparent;
  }

  80% {
    border-left: 1px solid transparent;
    border-top: 1px solid transparent;
  }

  100% {
    border-left: 1px solid var(--zyn-ov-brighter-200);
    border-top: 1px solid var(--zyn-ov-brighter-200);
    border-top-left-radius: var(--zyn-br-lg);
  }
}

@keyframes borderHeight {
  0% {
    height: 0;
    background: var(--zyn-ov-brighter-500);
  }

  50% {
    height: calc(100% - 1px);
    background: var(--zyn-ov-brighter-100);
  }

  75% {
    height: calc(100% - 1px);
    background: var(--zyn-ov-brighter-100);
  }

  100% {
    height: 100%;
    background: transparent;
  }
}

@keyframes fadeInDeco {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 0.5;
  }
}

@keyframes comeIn {
  0%, 50% {
    transform: rotate(-90deg) translateY(-5rem);
  }

  100% {
    transform: rotate(-90deg) translateY(0);
  }
}

@keyframes comeInTop {
  0% {
    height: 0;
    max-height: 0 !important;
    overflow: hidden;
  }

  100% {
    height: 40px;
    max-height: 40px !important;
    overflow: hidden;
  }
}

@keyframes fallOff {
  50% {
    bottom: 1rem;
    transform: rotate(-90deg);
    opacity: 1;
    scale: 1;
  }
  99% {
    bottom: -5rem;
    transform: rotate(0);
    opacity: 0;
    scale: 0.5;
  }
  100% {
    bottom: -5rem;
    transform: rotate(0);
    opacity: 0;
    scale: 0;
    display: none;
  }
}

body.classic-menu {
  .root {
    background: black;
  }

  .main.withTitlebar {
    box-shadow: inset 1rem 1rem 1rem black !important;
  }
}
</style>