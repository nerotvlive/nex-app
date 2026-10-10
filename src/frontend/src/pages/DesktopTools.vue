<script setup lang="ts">
import '../assets/zyneon/css/tools.css';
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
    <h1 class="text-2xl font-bold mb-2">{{ t("pages.tools.title") }}</h1>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(333px,1fr))] gap-3">

    </div>
  </div>
</template>

<style scoped>
button.absolute {
  transition: all 0.2s ease;
}

button.absolute:hover {
  background: var(--zyn-ov-brighter-400);
  cursor: pointer;
}
</style>