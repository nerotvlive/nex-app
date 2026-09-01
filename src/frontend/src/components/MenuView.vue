<script setup lang="ts">
import '@/assets/zyneonstudios/styles/components/menuview.css';
</script>

<template>
  <div class="flex">
    <div class="flex flex-col bg-zinc-950/50 p-3 gap-2 menu">
      <slot name="menu"></slot>
    </div>
    <slot name="content"></slot>
  </div>
</template>

<style scoped>
div.menu {
  * {

  }
}
</style>