<script setup lang="ts">
import DashboardHome from "@/components/DashboardHome.vue";
import '@/assets/zyneonstudios/styles/pages/Dashboard.css';

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