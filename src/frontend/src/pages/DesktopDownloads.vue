<script setup lang="ts">
import '../assets/zyneon/css/downloads.css';
import {useI18n} from "vue-i18n";
const { t } = useI18n();
</script>

<template>
  <div class="w-full h-full p-3">
    <h1 class="text-2xl font-bold">{{ t("menu.downloads") }}</h1>
  </div>
</template>