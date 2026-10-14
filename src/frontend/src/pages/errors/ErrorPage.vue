<script setup lang="ts">
import {onMounted} from "vue";
import {useI18n} from "vue-i18n";
import {ZyneonSettings} from "../../assets/zyneon/scripts";

const { t } = useI18n()
onMounted(() => {
  ZyneonSettings.setMenuExpanded(false);
  const header = document.querySelector('.header');
  if(header) {
    header.classList.add('active');
    const headerText = header.querySelector('.header h1');
    if (headerText) {
      if (headerText.querySelector('.gray-text')) {
        headerText.querySelector('.gray-text')?.classList.add('active');
      }
      if (headerText.querySelector('.special-text')) {
        headerText.querySelector('.special-text')?.classList.add('active');
      }
    }
  }
})

const urlParams = new URLSearchParams(window.location.search);
let errorCode = "500";
let errorMessage = t('pages.error.unknown');
let injectedError = "";

if(urlParams.get('errcode')) {
  errorCode = urlParams.get('errcode') || '500';
  injectedError = t('pages.error.injection');
}
if(urlParams.get('errmessage')) {
  errorMessage = urlParams.get('errmessage') || t('pages.error.unknown');
  injectedError = t('pages.error.injection');
}

withDefaults(defineProps<{
  showHomeButton?: boolean
  showRetryButton?: boolean
}>(), {
  showHomeButton: false,
  showRetryButton: false
})

const redirect = (url:string) => {
  const urlParamsString = urlParams.toString();
  window.location.href = url + "?" + urlParamsString;
}

</script>

<template>
  <div class="header relative h-full flex flex-col">
    <div class="header-overlay"></div>
    <div class="header-content max-w-6xl mx-auto w-full py-4 grow flex flex-col justify-between items-center text-center">
      <div class="px-4">{{ injectedError }}</div>
      <div class="flex flex-col items-center">
        <div>
          <h1 ref="header-text" class="text-5xl sm:text-6xl md:text-7xl px-4 font-bold"><span class="gray-text"><slot name="error">{{ t('pages.error.title') }}</slot></span> <span class="special-text"><slot name="error-code">{{ errorCode }}</slot></span></h1>
          <p class="py-4 text-xl"><slot name="message">{{ errorMessage }}</slot></p>
        </div>
        <div class="flex gap-4 p-4 pt-8">
          <a @click="redirect('/')" class="zyn-btn" v-if="showHomeButton">
            <i class="bi bi-caret-left-fill mr-0.5"></i>
            {{ t('pages.error.buttons.home') }}
          </a>
          <a onclick="window.location.reload()" class="zyn-btn" v-if="showRetryButton">
            <i class="bi bi-arrow-clockwise mr-0.5"></i>
            {{ t('pages.error.buttons.retry') }}
          </a>
          <slot name="buttons"></slot>
        </div>
      </div>
      <div>
        <i class="bi bi-emoji-tear text-2xl"></i>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header {
  opacity: 0;
  background: var(--zyn-background-body);
  border-bottom: 1px solid #ffffff15;
  overflow: hidden;

  h1 {
    transform: translateY(2rem);
    animation: textIn 1s ease-in-out forwards;
  }

  .header-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    background-image: linear-gradient(to right, #d1d5db20 1px, transparent 1px), linear-gradient(to bottom, #d1d5db20 1px, transparent 1px);
    background-size: 64px 64px;
    -webkit-mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%);
    mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%);
    animation: fadeIn 5s ease-in-out forwards;
  }

  .header-content {
    z-index: 2;
  }

  .gray-text, .special-text {
    background: -webkit-linear-gradient(#fff, #333);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    opacity: 0;
  }

  .special-text {
    background: -webkit-linear-gradient(#ffbaba, red);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .gray-text.active {
    animation: fadeIn 2s ease-in-out forwards;
  }

  .special-text.active {
    animation: specialIn 3s ease-in-out forwards;
  }
}

.header.active {
  animation: fadeIn 1s ease-in-out forwards;
}
</style>