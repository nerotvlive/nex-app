<script setup>
import { ref } from 'vue';

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
  <div class="menu" :class="{ 'active': isNavActive }" @mousedown="startDrag">
    <button @click="toggleNavigation" @mousedown.stop>
      <i class="bi bi-list"></i>
      <span>Toggle menu</span>
    </button>
    <router-link to="/" @mousedown.stop active-class="active">
      <i class="bi bi-house-door"></i>
      <span>Dashboard</span>
    </router-link>
  </div>
</template>

<style scoped>
div.menu {
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  gap: 0.5rem;
  width: 3.5rem;
  transition: width 0.25s ease;
  overflow: hidden;

  button, a {
    height: 2.5rem;
    min-width: 2.5rem;
    width: 2.5rem;
    border-radius: 0.5rem;
    display: flex;
    white-space: nowrap;

    i {
      position: absolute;
      height: 2.5rem;
      width: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }

    span {
      position: absolute;
      left: 3.75rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      background: #00000090;
      padding: 0 0.5rem;
      border-radius: 0.5rem;
      opacity: 0;
      z-index: -1;
      transform: translateX(-0.5rem);
    }
  }

  button:hover,a:hover {
    background: #ffffff20;
    transition: all 0.25s ease;
    cursor: pointer;

    span {
      opacity: 1;
      z-index: 1;
      transition: all 0.25s ease;
      transform: translateX(0rem);
    }
  }

  button.active ,a.active {
    background: white;

    i {
      color: black;
    }
  }
}

div.menu.active {
  width: 12rem;

  button,a {
    width: 100%;
    transition: width 0.25s ease;

    span {
      position: relative;
      left: unset;
      padding: 0 0 0 2.5rem;
      background: unset;
      z-index: unset;
      opacity: 1;
      transition: all 0.5s ease;
      transform: translateX(0rem);
      max-width: 10.5rem;
      overflow: hidden;
    }
  }

  button.active ,a.active {
    background: white;
    color: black;
  }
}
</style>