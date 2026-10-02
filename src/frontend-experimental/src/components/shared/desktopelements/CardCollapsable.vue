<script setup lang="ts">
import '../../../assets/zyneon/css/components/desktop-element-card-collapsable.css';
import Card from "./Card.vue";
defineProps<{
  background?: string
  border?: string
  disabled?: boolean
}>()
</script>

<template>
  <Card :background="background" :border="border">
    <div class="collapsable-card flex flex-col h-full" :class="disabled ? 'disabled' : ''">
      <div class="header px-3 pt-2" onclick="this.parentElement.classList.toggle('active')">
        <slot name="header"></slot>
        <i class="icon-chevron-down"></i>
      </div>
      <div class="content">
        <slot name="content"></slot>
      </div>
    </div>
  </Card>
</template>