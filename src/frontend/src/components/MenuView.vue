<script setup lang="ts">
import '@/assets/zyneonstudios/styles/components/menuview.css';

defineProps<{
  isDisabled?: boolean;
}>();
</script>

<template>
  <div class="flex menuview">
    <div class="flex flex-col p-3 menu" :class="{ disabled: isDisabled }">
      <slot name="menu"></slot>
    </div>
    <div class="content grow">
      <slot name="content"></slot>
    </div>
  </div>
</template>

<style scoped>
div.menu {
  * {

  }
}
</style>