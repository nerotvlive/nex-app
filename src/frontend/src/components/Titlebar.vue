<script setup>
const startDrag = () => {
  if (window.startWindowDrag) {
    window.startWindowDrag();
  }
  if(window.cefQuery) {
    window.cefQuery({ request: "startWindowDrag" });
  }
};

const closeApp = () => {
  if (window.closeWindow) {
    window.closeWindow();
  }
  if(window.cefQuery) {
    window.cefQuery({ request: "closeWindow" });
  }
};

const maximizeApp = () => {
  if (window.maximizeWindow) {
    window.maximizeWindow();
  }
  if(window.cefQuery) {
    window.cefQuery({ request: "maximizeWindow" });
  }
};

const minimizeApp = () => {
  if (window.minimizeWindow) {
    window.minimizeWindow();
  }
  if(window.cefQuery) {
    window.cefQuery({ request: "minimizeWindow" });
  }
};
</script>

<template>
  <div class="titlebar" @mousedown="startDrag">
    <div class="flex justify-between items-center">
      <span><strong class="ml-3">NEX</strong> App</span>
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

<style scoped>
  .titlebar {
    -webkit-app-region: drag;

    button {
      -webkit-app-region: no-drag;
      height: 2rem;
      width: 2rem;
    }

    button:hover {
      background-color: #ffffff25;
      cursor: pointer;
    }

    button.close:hover {
      background-color: red;
    }
  }
</style>