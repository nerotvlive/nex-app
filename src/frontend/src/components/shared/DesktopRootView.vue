<script setup lang="ts">

</script>

<template>
  <div class="h-full w-full flex-view flex">
      <slot name="left"></slot>
      <slot name="center"></slot>
      <slot name="right"></slot>
  </div>
</template>