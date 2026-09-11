<script setup lang="ts">
import MenuBar from "@/components/MenuBar.vue";

defineProps<{
  menuDisabled?: boolean;
  title?: string;
  id?: string;
}>();

const scrollToContent = () => {
  const contentElement = document.querySelector('.instance-content');
  contentElement?.scrollIntoView({ behavior: 'smooth' });
};
</script>

<template>
  <div class="h-full instance-view flex flex-col">
    <MenuBar :title="title" :menuDisabled="menuDisabled" class="w-full border-b relative z-10">
      <template #menu>
        <div class="flex gap-1">
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
      <div class="instance-header relative flex h-2/5 max-h-2/5 justify-center items-center">
        <i @click="scrollToContent" class="bi bi-caret-down-fill absolute bottom-3 right-3 z-10 w-6 h-6 flex justify-center items-center hover:bg-white/25 rounded-md hover:cursor-pointer"></i>
        <img alt="logo" src="https://www.wolkenspeicher.cloud/index.php/s/rNZSmanwYi8M2Xn/download" class="w-full h-full object-contain bg-black/25">
      </div>
      <div class="seperator"></div>
      <div class="instance-content bg-zinc-800">

      </div>
    </div>
  </div>
</template>

<style scoped>
.instance-view {

  .seperator {
    width: 100%;
    height: 1px;
    background-color: var(--color-zinc-800);
    border-top: 1px solid #ffffff25;
  }

  .instance-header {
    background: url("https://www.wolkenspeicher.cloud/index.php/s/TZgqdwd3ySSm6R2/download");
    background-size: cover;

    img {
      backdrop-filter: blur(4px);
    }
  }

  .instance-content {
    min-height: calc(100% + 1px);
  }
}
</style>