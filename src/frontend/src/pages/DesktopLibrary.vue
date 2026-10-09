<script setup lang="ts">
import '../assets/zyneon/css/library.css';
import {onMounted} from "vue";
import {ZyneonSettings} from "../assets/zyneon/scripts";
import {useI18n} from "vue-i18n";
const { t } = useI18n();

onMounted(()=>{
  ZyneonSettings.setMenuExpanded(false);
})
</script>

<template>
  <div class="w-full h-full p-3">
    <h1 class="text-2xl font-bold">{{ t("menu.library") }}</h1>
  </div>
</template>