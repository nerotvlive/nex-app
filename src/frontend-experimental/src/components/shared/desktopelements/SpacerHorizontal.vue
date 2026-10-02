<script setup lang="ts">
import '../../../assets/zyneon/css/components/desktop-element-spacer-horizontal.css';
import Spacer from "./Spacer.vue";
defineProps<{
  width?: string
  height?: string
  color?: string
}>()
</script>

<template>
  <Spacer width="100%" height="fit-content" :style="{ height: height, width: width, color: color }">
    <slot>
      <div class="spacer-horizontal my-2">
        <hr style="color: var(--zyn-ov-brighter-300);" :style="{ backgroundColor: color }">
      </div>
    </slot>
  </Spacer>
</template>