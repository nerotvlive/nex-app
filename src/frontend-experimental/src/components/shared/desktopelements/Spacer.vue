<script setup lang="ts">
import '../../../assets/zyneon/css/components/desktop-element-spacer.css';
import DesktopElement from "./DesktopElement.vue";
defineProps<{
  width?: string
  height?: string
  color?: string
}>()
</script>

<template>
  <DesktopElement>
    <div class="spacer w-4 h-4 relative bg-transparent" :style="{ height: height, width: width }">
      <slot></slot>
    </div>
  </DesktopElement>
</template>