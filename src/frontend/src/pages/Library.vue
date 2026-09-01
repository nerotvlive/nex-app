<script setup lang="ts">

import MenuView from "@/components/MenuView.vue";
</script>

<template>
  <div class="library h-full w-full">
    <MenuView>
      <template #menu>
        <button>
          <i class="bi bi-grid-3x3-gap-fill"></i>
          Overview
        </button>
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

      </template>
    </MenuView>
  </div>
</template>

<style scoped>
.library {
  background: url("../assets/zyneonstudios/images/background.jpg");
  background-size: cover;
}
</style>