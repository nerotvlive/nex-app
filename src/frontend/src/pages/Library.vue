<script setup lang="ts">
import { ref } from 'vue';
import MenuView from "@/components/MenuView.vue";

const isMenuDisabled = ref(false);

const toggleMenu = () => {
  isMenuDisabled.value = !isMenuDisabled.value;
};
</script>

<template>
  <div class="library h-full w-full">
    <MenuView :isDisabled="isMenuDisabled">
      <template #menu>
        <div class="flex gap-1">
          <button @click="toggleMenu" :class="{ 'rotate-0': !isMenuDisabled, 'rotate-180': isMenuDisabled }">
            <i class="bi bi-arrow-bar-left"></i>
          </button>
          <button class="grow">
            <i class="bi bi-grid-3x3-gap-fill"></i>
            Overview
          </button>
        </div>
        <div class="flex gap-1">
          <button class="grow">
            <i class="bi bi-plus-lg"></i>
            Add Instance
          </button>
          <button>
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
        <hr>
      </template>
      <template #content>
        <button @click="toggleMenu" class="absolute left-3 top-3 bg-zinc-800 h-8 w-8 rounded-lg shadow-lg shadow-black/25 hover:bg-zinc-700 hover:cursor-pointer transition-all" :class="{ 'hide rotate-180': !isMenuDisabled, 'rotate-0': isMenuDisabled }">
          <i class="bi bi-arrow-bar-right transition-all"></i>
        </button>
      </template>
    </MenuView>
  </div>
</template>

<style scoped>
.library {
  .hide {
    opacity: 0;
    z-index: -1;
  }
}
</style>