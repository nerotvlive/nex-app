<script setup lang="ts">
import {WindowControls} from "../assets/zyneon/scripts";
import {useRouter, useRoute} from "vue-router";
import {onMounted, onUnmounted} from "vue";
import {useI18n} from "vue-i18n";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
let timer: ReturnType<typeof setTimeout> | null = null;

onMounted(() => {
  timer = setTimeout(() => {
    router.push({
      path: '/',
      query: {
        ...route.query,
        intro: 'skip'
      }
    });
  }, 10000);
});

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer);
  }
});
</script>

<template>
  <div class="main" @mousedown="WindowControls.startDrag()">
    <div class="northern-aurora absolute inset-0 z-0 pointer-events-none" />
    <div class="z-1 overflow-hidden overflow-y-auto w-full intro">
      <h1 class="text-6xl font-mono absolute text-white welcome">{{ t("pages.start.intro.welcome") }}</h1>
      <h1 class="text-7xl font-mono absolute text-white tothe">{{ t("pages.start.intro.tothe") }}</h1>
      <h1 class="text-8xl font-mono absolute text-white allnew">{{ t("pages.start.intro.allnew") }}</h1>
      <h1 class="text-9xl font-mono absolute nexapp font-bold">NEX APP</h1>
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
  text-align: center;
  flex-direction: column;

  .intro {
    height: 100%;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    align-items: center;
    display: flex;

    .welcome {
      animation: welcome 8s ease-in-out forwards;
      transform: translateX(110vh);
      opacity: 0;
    }

    .tothe {
      animation: tothe 8s ease-in-out forwards;
      transform: translateX(110vh);
      opacity: 0;
    }

    .allnew {
      animation: allnew 8s ease-in-out forwards;
      transform: translateX(110vh);
      opacity: 0;
    }

    .nexapp {
      animation: nexapp 11s ease-in-out forwards;
      scale: 0;
      opacity: 0;
    }
  }

  .northern-aurora {
    opacity: 0;
    animation: fadeInGradient 8s ease-in-out forwards;
    background: center
    radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255, 20, 147, 0.15), transparent 50%),
    radial-gradient(ellipse 160% 130% at 10% 10%, rgba(0, 255, 255, 0.12), transparent 60%),
    radial-gradient(ellipse 160% 130% at 90% 90%, rgba(138, 43, 226, 0.18), transparent 65%),
    radial-gradient(ellipse 110% 50% at 80% 30%, rgba(255, 215, 0, 0.08), transparent 40%),
    #000000;
    background-size: 300%;
    filter: grayscale(100%);
  }
}

@keyframes welcome {
  0% {
    transform: translateX(110vh);
    opacity: 0;
  }
  20% {
    transform: translateX(0);
    opacity: 1;
  }
  40% {
    transform: translateX(-110vh);
    opacity: 0;
  }
  100% {
    transform: translateX(-110vh);
    opacity: 0;
  }
}

@keyframes tothe {
  20% {
    transform: translateY(110vh);
    opacity: 0;
  }
  40% {
    transform: translateY(0);
    opacity: 1;
  }
  60% {
    transform: translateY(-110vh);
    opacity: 0;
  }
  100% {
    transform: translateY(-110vh);
    opacity: 0;
  }
}

@keyframes allnew {
  40% {
    transform: translateX(-110vh);
    opacity: 0;
  }
  60% {
    transform: translateX(0);
    opacity: 1;
  }
  80% {
    transform: translateX(110vh);
    opacity: 0;
  }
  100% {
    transform: translateX(110vh);
    opacity: 0;
  }
}

@keyframes nexapp {
  45% {
    opacity: 0;
    color: white;
    text-shadow: 0 0 1rem transparent;
    scale: 0;
  }
  65% {
    opacity: 1;
    color: var(--zyn-accent);
    text-shadow: 0 0 0.5rem var(--zyn-accent);
    scale: 1;
  }
  75% {
    opacity: 1;
    color: var(--zyn-accent);
    text-shadow: 0 0 1rem var(--zyn-accent);
  }
  100% {
    color: white;
    text-shadow: 0 0 1rem transparent;
    opacity: 0;
    scale: 100;
  }
}

@keyframes fadeInGradient {
  from {
    opacity: 0;
    filter: grayscale(100%);
    background-size: 500%;
  }
  to {
    opacity: 0.75;
    background-size: 100%;
    filter: grayscale(0%);
  }
}
</style>