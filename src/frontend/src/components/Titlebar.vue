<script setup>
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
  if (window.maximizeWindow) {
    window.maximizeWindow();
  }
};

const minimizeApp = () => {
  if (window.minimizeWindow) {
    window.minimizeWindow();
  }
};
</script>

<template>
  <div class="titlebar" @mousedown="startDrag">
    <div class="flex justify-between items-center">
      <strong class="ml-3">NEX App</strong>
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
    button {
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