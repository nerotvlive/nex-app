<script setup lang="ts">
import '../../../assets/zyneon/css/components/desktop-element-card.css';
import DesktopElement from "./DesktopElement.vue";
defineProps<{
  backgroundImage?: string
  background?: string
  border?: string
}>()
</script>

<template>
  <div class="card zyn-br-md shadow-lg backdrop-blur-lg" :style="{backgroundImage: backgroundImage, background: background, border: border}">
    <DesktopElement class="h-full flex-1 grow">
      <slot></slot>
    </DesktopElement>
  </div>
</template>