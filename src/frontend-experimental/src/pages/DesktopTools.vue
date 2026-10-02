<script setup lang="ts">
import '../assets/zyneon/css/tools.css';
import CardStructured from "../components/shared/desktopelements/CardStructured.vue";
import Badge from "../components/shared/desktopelements/Badge.vue";

async function launchTool(toolName: string) {
  if(window.openTool) {
    window.openTool(toolName);
  }
}
</script>

<template>
  <div class="w-full h-full p-3">
    <h1 class="text-2xl font-bold mb-2">Tools & Experiments</h1>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(333px,1fr))] gap-3">
      <CardStructured class="zyn-ov-brighter-200 opacity-75 transition-all text-white" border="1px solid var(--zyn-ov-brighter-200)">
        <template #header>
          <h2 class="text-xl font-bold flex gap-1 overflow-hidden whitespace-nowrap">SerwiN<badge background="#00000075">EX</badge><badge background="#00000075">FT</badge></h2>
        </template>
        <template #content>
          <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md">
            Open Zyneon Desktops integration of the SerwiN game server manager
          </div>
        </template>
        <template #footer>
          <div class="w-full flex justify-end align-bottom min-h-9">
            <button style="border: 1px solid var(--zyn-ov-brighter-200);" @click="(e: any) => { launchTool('SerwiN'); e.target.innerText = 'Show'; }">Launch</button>
          </div>
        </template>
      </CardStructured>
      <CardStructured class="zyn-ov-brighter-200 opacity-75 transition-all text-white" border="1px solid var(--zyn-ov-brighter-200)">
        <template #header>
          <h2 class="text-xl font-bold flex gap-1 overflow-hidden whitespace-nowrap">JSON Explorer<badge background="#00000075">EX</badge><badge background="#00000075">FT</badge></h2>
        </template>
        <template #content>
          <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md">
            Open Zyneon Desktops integration of the new web based JSON Explorer
          </div>
        </template>
        <template #footer>
          <div class="w-full flex justify-end align-bottom min-h-9">
            <button style="border: 1px solid var(--zyn-ov-brighter-200);" @click="(e: any) => { launchTool('JSON-Explorer'); e.target.innerText = 'Show'; }">Launch</button>
          </div>
        </template>
      </CardStructured>
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