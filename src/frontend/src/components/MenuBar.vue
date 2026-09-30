<script setup lang="ts">
import '@/assets/zyneonstudios/styles/components/MenuBar.css';

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