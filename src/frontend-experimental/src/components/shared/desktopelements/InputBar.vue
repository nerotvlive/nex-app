<script setup lang="ts">
import '../../../assets/zyneon/css/components/desktop-element-input.css';
import DesktopElement from "./DesktopElement.vue";
defineProps<{
  background: string
  placeholder?: string
}>()
</script>

<template>
  <DesktopElement>
    <div class="input-element px-0 py-0 zyn-br-sm flex" style="font-size: 0.8rem" :style="{ backgroundColor: background }">
      <slot name="start"></slot>
      <slot name="center">
        <input type="text" class="input" :placeholder="placeholder"/>
      </slot>
      <slot name="end"></slot>
    </div>
  </DesktopElement>
</template>