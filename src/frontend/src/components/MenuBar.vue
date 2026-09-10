<script setup lang="ts">
defineProps<{
  menuDisabled?: boolean;
  title?: string;
}>();
</script>

<template>
  <div class="transition-all text-xl bg-zinc-800/75 flex justify-between p-3 px-4 menubar h-14" :class="{ 'pl-13': menuDisabled }">
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
    border-color: #ffffff15;
    box-shadow: 0 0 0.5rem #0009;
    backdrop-filter: blur(10px);
  }
</style>