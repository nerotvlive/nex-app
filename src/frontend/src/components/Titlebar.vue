<script setup lang="ts">
import {onMounted, ref} from "vue";
import '@/assets/zyneonstudios/styles/components/Titlebar.css';
import {getApplicationStatus} from "@/assets/zyneonstudios/scripts/types";

declare global {
  interface Window {
    startWindowDrag?: () => void;
    closeWindow?: () => void;
    toggleMaximizeWindow?: () => void;
    minimizeWindow?: () => void;
  }
}

const startDrag = () => {
  if (window.startWindowDrag) {
    window.startWindowDrag();
  }
};

const closeApp = () => {
  if (window.closeWindow) {
    window.closeWindow();
  }
};

const maximizeApp = () => {
  if (window.toggleMaximizeWindow) {
    window.toggleMaximizeWindow();
  }
};

const minimizeApp = () => {
  if (window.minimizeWindow) {
    window.minimizeWindow();
  }
};

const version = ref<string>("No backend");
const versionType = ref<string>('stable');
const versionBuild = ref<string>('..');
onMounted(async () => {
  const status = await getApplicationStatus();
  version.value = status.version.number;
  versionType.value = status.version.type;
  versionBuild.value = status.version.build;
});
</script>

<template>
  <div class="titlebar" @mousedown="startDrag">
    <div class="flex justify-between items-center">
      <span><strong class="ml-3">NEX</strong> App <span :class="versionType === 'stable' ? 'hidden' : ''">({{version}}-{{versionType}}.{{versionBuild}})</span></span>
      <div class="flex window-controls">
        <button @click="minimizeApp()" @mousedown.stop>
          <i class="bi bi-dash-lg"></i>
        </button>
        <button @click="maximizeApp()" @mousedown.stop>
          <i class="bi bi-fullscreen"></i>
        </button>
        <button class="close" @click="closeApp" @mousedown.stop>
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    </div>
  </div>
</template>