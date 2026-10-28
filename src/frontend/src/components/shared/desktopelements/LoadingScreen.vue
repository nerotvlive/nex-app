<script setup lang="ts">
import {onMounted, onUnmounted} from "vue";
import {WindowControls} from "../../../assets/zyneon/scripts";
import {useRoute, useRouter} from "vue-router";
const route = useRoute();
const router = useRouter();

let timer: ReturnType<typeof setTimeout> | null = null;
const urlParams = new URLSearchParams(window.location.search);
const shutdown = urlParams?.get("shutdown")==="true" || false;
const setup = urlParams?.get("setup")==="true" || false;

const finishIntro = () => {
  if(shutdown) return;
  const intro = document.getElementById("intro");
  const gradient = document.querySelector(".northern-aurora");
  gradient?.classList.add("finish");
  if (intro) {
    intro?.classList.add("finish");
    timer = setTimeout(() => {
      let startpage: string = "/dashboard"
      if(!localStorage.getItem("nexapp.neo.settings.general.startpage")) {
        localStorage.setItem("nexapp.neo.settings.general.startpage","/dashboard");
      } else {
        startpage = localStorage.getItem("nexapp.neo.settings.general.startpage") || "/dashboard";
      }
      if(setup) {
        router.push({
          path: '/',
          query: {
            ...route.query,
            intro: "skip"
          }
        });
        return;
      } else {
        window.location.href = startpage;
      }
    }, 2000);
  }
};

onMounted(() => {
  window.finishIntro = finishIntro;

  if(!shutdown) {
    if (!window.setup) {
      finishIntro();
    } else {
      window.setup();
    }
  }
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

    .nexapp {
      animation: loader_nexapp 2s ease-in-out forwards;
      scale: 0;
      opacity: 0;
    }

    .loader-container {
      width: 3rem;
      height: 3rem;
      overflow: hidden;
      position: relative;
      animation: loader_loader 2s ease-in-out forwards;
      opacity: 0;

      .rotate {
        left: 0;
        width: 3rem;
        height: 3rem;
        overflow: hidden;
        animation: loader_rotate 1s linear infinite;
      }
    }
  }

  .intro.finish {

    .nexapp {
      animation: loader_nexappFinish 2s ease-in-out forwards;
    }

    .loader-container {
      animation: loader_loaderFinish 500ms ease-in-out forwards;
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

  .northern-aurora.finish {
    animation: loader_gradientFinish 2s ease-in-out forwards;
  }
}

@keyframes loader_rotate {
  0% {
    rotate: 0deg;
  }
  100% {
    rotate: 360deg;
  }
}

@keyframes loader_nexapp {
  0% {
    transform: translateY(0rem);
    opacity: 0;
    color: white;
    text-shadow: 0 0 1rem transparent;
    scale: 0;
  }
  50% {
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

@keyframes loader_nexappFinish {
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

@keyframes loader_loader {
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

@keyframes loader_loaderFinish {
  0% {
    opacity: 1;
    transform: translateY(4rem);
  }
  100% {
    opacity: 0;
    transform: translateY(4rem);
  }
}

@keyframes loader_gradientFinish {
  from {
    opacity: 1;
    background-size: 100%;
    filter: grayscale(0%);
  }
  to {
    opacity: 0;
    background-size: 100%;
    filter: grayscale(0%);
  }
}
</style>