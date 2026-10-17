<script setup lang="ts">
import '@/assets/zyneonstudios/styles/pages/errors/Error.css';
</script>
<template>
  <div class="flex flex-col items-center h-full justify-center text-center">
    <div class="rounded-xl border m-4 md:m-8 px-16 p-8 border-zinc-700 bg-zinc-800 shadow-lg shadow-black/25">
      <h3 class="font-semibold text-red-300 text-2xl"><slot name="error"></slot></h3>
      <p class="py-2"><slot name="message"></slot></p>
      <div class="pt-4 pb-1 flex gap-2 text-center align-items-center justify-center">
        <a href="/"><button class="bg-red-300 hover:bg-red-400 border border-red-300 text-black py-2 px-4 rounded-xl cursor-pointer shadow-lg transition">Back to Home</button></a>
        <slot name="buttons"></slot>
      </div>
    </div>
  </div>
</template>