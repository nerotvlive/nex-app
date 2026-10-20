<script setup lang="ts">
import '../../../assets/zyneon/css/components/desktop-element-card-collapsable.css';
import Card from "./Card.vue";

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
  <Card :backgroundOverride="backgroundOverride" :borderOverride="borderOverride">
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