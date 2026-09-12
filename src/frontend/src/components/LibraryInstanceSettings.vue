<script setup lang="ts">
import MenuBar from "@/components/MenuBar.vue";
import type { InstanceWrapper } from '@/data/mockInstances';

defineProps<{
  menuDisabled?: boolean;
  instance: InstanceWrapper;
}>();
</script>

<template>
  <div class="h-full instance-settings flex flex-col">
    <MenuBar :title="instance.instance.info.name" :menuDisabled="menuDisabled" class="w-full border-b relative z-10">
      <template #menu>
        <div class="flex gap-1">
          <button class="px-3 p-2 bg-blue-500/15 hover:bg-blue-500/25 text-white text-sm rounded transition hover:shadow-lg shadow-black/25 cursor-pointer hidden" title="Update instance">
            <i class="bi bi-download"></i>
          </button>
          <button class="px-3 p-2 bg-zinc-500/25 hover:bg-zinc-400/25 text-white text-sm rounded transition hover:shadow-lg shadow-black/25 cursor-pointer" title="Open instance folder">
            <i class="bi bi-folder2"></i>
          </button>
          <button class="px-3 p-2 bg-zinc-500/25 hover:bg-zinc-400/25 text-white text-sm rounded transition hover:shadow-lg shadow-black/25 cursor-pointer" title="Open instance settings">
            <i class="bi bi-gear"></i>
          </button>
        </div>
      </template>
    </MenuBar>
    <div class="grow overflow-y-auto overflow-hidden">
      <div class="seperator"></div>
      <div class="instance-content bg-zinc-800 relative p-6">
        <button class="fixed flex gap-2 bottom-4 right-4 text-2xl font-bold p-4 px-6 bg-blue-600 rounded-lg shadow-lg shadow-black/10 hover:bg-blue-500 hover:shadow-blue-600/10 transition hover:cursor-pointer">
          <i class="bi bi-rocket-takeoff-fill"></i>
          <span>LAUNCH</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.instance-settings {
  .seperator {
    width: 100%;
    height: 1px;
    background-color: var(--color-zinc-800);
    border-top: 1px solid #ffffff25;
  }

  .instance-content {
    min-height: calc(100% + 1px);
  }
}
</style>