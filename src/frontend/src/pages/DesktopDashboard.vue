<script setup lang="ts">
import '../assets/zyneon/css/dashboard.css';
import DashboardHeader from "../components/shared/desktopelements/DashboardHeader.vue";
import {ZyneonSettings} from "../assets/zyneon/scripts";
import {onMounted} from "vue";

onMounted(() => {
  ZyneonSettings.setMenuExpanded(localStorage.getItem("nexapp.neo.settings.view.menu") === "true");
});

</script>

<template>
  <div class="w-full h-full p-3">
    <DashboardHeader>
      <template #bottom-right>
        <a class="absolute bottom-0 text-md xl:text-lg">
          <button class="zyn-btn compact transparent">
            <i class="bi bi-caret-down-fill text-white"></i>
          </button>
        </a>
      </template>
    </DashboardHeader>
  </div>
</template>