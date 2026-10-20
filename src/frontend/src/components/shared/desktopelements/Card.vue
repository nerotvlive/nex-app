<script setup lang="ts">
import '../../../assets/zyneon/css/components/desktop-element-card.css';
import DesktopElement from "./DesktopElement.vue";
const props = withDefaults(
    defineProps<{
      backgroundOverride?: string
      borderOverride?: string
      disabled?: boolean
    }>(),
    {
      backgroundOverride: "var(--zyn-ov-brighter-200)",
      borderOverride: "1px solid var(--zyn-ov-brighter-200)",
      disabled: false
    }
)
</script>

<template>
  <div class="card zyn-br-md shadow-lg backdrop-blur-lg" :style="{background: backgroundOverride, border: borderOverride}">
    <DesktopElement class="h-full flex-1 grow">
      <slot></slot>
    </DesktopElement>
  </div>
</template>