<script setup lang="ts">
defineProps<{
  menuDisabled?: boolean;
  title?: string;
}>();
</script>

<template>
  <div class="transition-all text-xl flex justify-between menubar items-center px-3" :class="{ 'pl-13': menuDisabled }">
    <div>
      <slot name="title">
        <strong>
          {{ title }}
        </strong>
      </slot>
    </div>
    <div>
      <slot name="menu">
        {{ menuDisabled }}
      </slot>
    </div>
  </div>
</template>

<style scoped>
  .menubar {
    background: #212123;
    min-height: 3.5rem;
    max-height: 3.5rem;
    border-color: #ffffff25;
    box-shadow: 0 0 0.5rem #0004;
  }
</style>