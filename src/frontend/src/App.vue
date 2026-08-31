<script setup lang="ts">
import Menu from "@/components/Menu.vue";
import Titlebar from "@/components/Titlebar.vue";
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <Titlebar />
    <div class="grow overflow-hidden flex">
      <Menu class="overflow-y-auto" />
      <div class="grow overflow-y-auto bg-zinc-900 rounded-tl-2xl border-l border-t border-zinc-800">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.shadow-inset-from-top {
  box-shadow: inset 0 0.1rem 0.3rem 0 #00000050;
}
</style>