<script setup lang="ts">
import '../assets/zyneon/css/downloads.css';
import {useI18n} from "vue-i18n";
import {onMounted} from "vue";
import {ZyneonSettings} from "../assets/zyneon/scripts";
const { t } = useI18n();

onMounted(() => {
  ZyneonSettings.setMenuExpanded(localStorage.getItem("nexapp.neo.settings.view.menu") === "true");
});
</script>

<template>
  <div class="w-full h-full p-3">
    <h1 class="text-2xl font-bold">{{ t("menu.downloads") }}</h1>
  </div>
</template>