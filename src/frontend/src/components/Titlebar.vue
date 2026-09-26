<script setup>
import {onMounted, ref} from "vue";
import '@/assets/zyneonstudios/styles/components/Titlebar.css';

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

const version = ref('0.0.0');
const versionBuild = ref('000000000000');
const versionType = ref('unstable');

onMounted(async () => {
  try {
    const response = await fetch("/api/v1/status");
    const versionNode = await response.json();
    version.value = versionNode.version.number;
    versionBuild.value = versionNode.version.build;
    versionType.value = versionNode.version.type;
  } catch (e) {
    console.error(e);
  }
})
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