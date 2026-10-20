<script setup lang="ts">
import {useRouter, useRoute} from "vue-router";
import {onMounted, onUnmounted} from "vue";
import {useI18n} from "vue-i18n";
import {WindowControls} from "../../assets/zyneon/scripts";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
let timer: ReturnType<typeof setTimeout> | null = null;


const finishIntro = () => {
  const intro = document.getElementById("intro");
  if (intro) {
    intro?.classList.add("finish");
    timer = setTimeout(() => {
      router.push({
        path: '/',
        query: {
          ...route.query,
          intro: 'skip'
        }
      });
    }, 2000);
  }
};

onMounted(() => {
  window.finishIntro = finishIntro;
  timer = setTimeout(() => {
    if(!window.setup) {
      finishIntro();
    } else {
      window.setup();
    }
  }, 10000);
});

onUnmounted(() => {
  delete window.finishIntro;
  if (timer) {
    clearTimeout(timer);
  }
});
</script>

<template>
  <div class="main" @mousedown="WindowControls.startDrag()">
    <div class="northern-aurora absolute inset-0 z-0 pointer-events-none" />
    <div class="z-1 overflow-hidden overflow-y-auto w-full intro" id="intro">
      <h1 class="text-6xl font-mono absolute text-white welcome">{{ t("pages.start.intro.welcome") }}</h1>
      <h1 class="text-7xl font-mono absolute text-white tothe">{{ t("pages.start.intro.tothe") }}</h1>
      <h1 class="text-8xl font-mono absolute text-white allnew">{{ t("pages.start.intro.allnew") }}</h1>
      <h1 class="text-9xl font-mono absolute nexapp font-bold">NEX APP</h1>
      <div class="text-5xl text-white loader-container"><i class="icon-loader-circle absolute rotate"></i></div>
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
      animation: nexapp 10s ease-in-out forwards;
      scale: 0;
      opacity: 0;
    }

    .loader-container {
      width: 3rem;
      height: 3rem;
      overflow: hidden;
      position: relative;
      animation: loader 11s ease-in-out forwards;
      opacity: 0;

      .rotate {
        left: 0;
        width: 3rem;
        height: 3rem;
        overflow: hidden;
        animation: rotate 1s linear infinite;
      }
    }
  }

  .intro.finish {
    .nexapp {
      animation: nexappFinish 3s ease-in-out forwards;
    }

    .loader-container {
      animation: loaderFinish 500ms ease-in-out forwards;
    }
  }

  .northern-aurora {
    opacity: 0;
    animation: fadeInGradient 12s ease-in-out forwards;
    background: center
    radial-gradient(ellipse 70% 55% at 50% 50%, rgba(255, 20, 147, 0.15), transparent 50%),
    radial-gradient(ellipse 160% 130% at 10% 10%, rgba(0, 255, 255, 0.12), transparent 60%),
    radial-gradient(ellipse 160% 130% at 90% 90%, rgba(138, 43, 226, 0.18), transparent 65%),
    radial-gradient(ellipse 110% 50% at 80% 30%, rgba(255, 215, 0, 0.08), transparent 40%),
    #090909;
    background-size: 300%;
    filter: grayscale(100%);
  }
}

@keyframes rotate {
  0% {
    rotate: 0deg;
  }
  100% {
    rotate: 360deg;
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
    transform: translateY(0rem);
    opacity: 0;
    color: white;
    text-shadow: 0 0 1rem transparent;
    scale: 0;
  }
  75% {
    opacity: 1;
    color: var(--zyn-accent);
    text-shadow: 0 0 0.5rem var(--zyn-accent);
    scale: 1;
  }
  80% {
    transform: translateY(0rem);
    opacity: 1;
    color: var(--zyn-accent);
    text-shadow: 0 0 0.75rem var(--zyn-accent);
    scale: 1;
  }

  100% {
    transform: translateY(-2rem);
    opacity: 1;
    color: var(--zyn-accent);
    text-shadow: 0 0 1rem var(--zyn-accent);
    scale: 1;
  }
}

@keyframes nexappFinish {
  0% {
    transform: translateY(-2rem);
    opacity: 1;
    color: var(--zyn-accent);
    text-shadow: 0 0 1rem var(--zyn-accent);
    scale: 1;
  }
  15% {
    transform: translateY(0rem);
    opacity: 1;
    color: var(--zyn-accent);
    text-shadow: 0 0 0.75rem var(--zyn-accent);
    scale: 1;
  }
  100% {
    scale: 100;
  }
}

@keyframes loader {
  45% {
    opacity: 0;
  }
  65% {
    opacity: 0;
  }
  75% {
    opacity: 0;
  }
  85% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: translateY(4rem);
  }
}

@keyframes loaderFinish {
  0% {
    opacity: 1;
    transform: translateY(4rem);
  }
  100% {
    opacity: 0;
    transform: translateY(4rem);
  }
}

@keyframes fadeInGradient {
  from {
    opacity: 0;
    filter: grayscale(100%);
    background-size: 500%;
  }
  to {
    opacity: 1;
    background-size: 100%;
    filter: grayscale(0%);
  }
}
</style>