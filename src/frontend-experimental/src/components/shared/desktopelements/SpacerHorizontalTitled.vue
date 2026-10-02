<script setup lang="ts">
import '../../../assets/zyneon/css/components/desktop-element-spacer-horizontal-titled.css';
import SpacerHorizontal from "./SpacerHorizontal.vue";
defineProps<{
  width?: string
  height?: string
  color?: string
  title: string
}>()
</script>

<template>
  <SpacerHorizontal width="100%" height="fit-content" :style="{ height: height, width: width, color: color }">
    <div class="spacer-horizontal-titled flex h-full w-full">
      <hr style="color: var(--zyn-ov-brighter-300); width: 1rem; margin-top: 0.75rem; margin-bottom: 1rem;" :style="{ backgroundColor: color }">
      <span class="w-fit px-2">{{ title }}</span>
      <hr class="w-full flex-2" style="color: var(--zyn-ov-brighter-300); margin-top: 0.75rem; margin-bottom: 1rem;" :style="{ backgroundColor: color }">
    </div>
  </SpacerHorizontal>
</template>