<script setup lang="ts">
import MenuBar from "@/components/MenuBar.vue";

defineProps<{
  menuDisabled?: boolean;
  title?: string;
  id?: string;
}>();


</script>

<template>
  <div class="h-full relative instance-view">
    <div class="instance-view-background w-full h-full absolute z-0"></div>
    <div class="z-1 instance-view-content w-full h-full">
      <MenuBar title="Library Instance" :menuDisabled="menuDisabled" class="w-full border-b" />
    </div>
  </div>
</template>

<style scoped>
  .instance-view {
    .instance-view-background {
      background: url("https://wallpapercave.com/wp/wp2586787.jpg");
      background-size: cover;
    }

    .instance-view-content {
      background: #00000050;
      backdrop-filter: blur(16px);
    }
  }
</style>