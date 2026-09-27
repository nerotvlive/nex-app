<script setup>
import { ref } from 'vue';
import '@/assets/zyneonstudios/styles/components/Menu.css';

const isNavActive = ref(false);
function toggleNavigation() {
  isNavActive.value = !isNavActive.value;
}

const startDrag = () => {
  if (window.startWindowDrag) {
    window.startWindowDrag();
  }
};
</script>

<template>
  <div class="mainMenu" :class="{ 'active': isNavActive }" @mousedown="startDrag">
    <div class="flex flex-col gap-2">
      <button @click="toggleNavigation" @mousedown.stop>
        <i class="bi bi-list"></i>
        <span>Toggle menu</span>
      </button>
      <router-link to="/" @mousedown.stop active-class="active">
        <i class="bi bi-house-door"></i>
        <span>Dashboard</span>
      </router-link>
      <router-link to="/library" @mousedown.stop active-class="active">
        <i class="bi bi-grid-1x2"></i>
        <span>Library</span>
      </router-link>
    </div>

    <div class="flex flex-col gap-2">
      <router-link to="/settings" @mousedown.stop active-class="active">
        <i class="bi bi-gear-wide"></i>
        <span>Settings</span>
      </router-link>
    </div>
  </div>
</template>