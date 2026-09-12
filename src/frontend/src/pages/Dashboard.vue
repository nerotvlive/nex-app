<script setup lang="ts">
import DashboardHome from "@/components/DashboardHome.vue";

declare global {
  interface Window {
    openUrl?: (url: string) => void;
  }
}
</script>

<template>
  <div class="dashboard h-full flex flex-col relative">
    <DashboardHome></DashboardHome>
  </div>
</template>

<style scoped>
div.dashboard {


  .header {
    height: 12rem;
    background: linear-gradient(to top, transparent, #00000099);
  }
}
</style>