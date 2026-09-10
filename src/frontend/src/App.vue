<script setup lang="ts">
import Menu from "@/components/Menu.vue";
import Titlebar from "@/components/Titlebar.vue";

</script>

<template>
  <div class="h-full w-full flex flex-col">
    <Titlebar />
    <div class="grow overflow-hidden flex">
      <Menu class="overflow-y-auto" />
      <div class="grow overflow-y-auto bg-zinc-900 border-l border-t content relative shadow-overlay rounded-tl-2xl overflow-hidden">
        <router-view class="" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.content {
  border-color: #3c3c3c;
}

.shadow-overlay::after {
  content: "";
  position: absolute;
  inset: 0;
  box-shadow: inset 0.3rem 0.3rem 0.5rem #0007;
  pointer-events: none;
  z-index: 20;
}
</style>