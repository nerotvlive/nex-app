<script setup lang="ts">
import '@/assets/zyneonstudios/styles/components/MenuView.css';

defineProps<{
  isDisabled?: boolean;
}>();
</script>

<template>
  <div class="flex menuview">
    <div class="flex flex-col menu" :class="{ disabled: isDisabled }">
      <slot name="menu"></slot>
    </div>
    <div class="content grow">
      <slot name="content"></slot>
    </div>
  </div>
</template>