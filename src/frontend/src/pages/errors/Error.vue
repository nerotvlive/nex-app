<script setup lang="ts">
</script>
<template>
  <div class="flex flex-col items-center">
    <div class="rounded-2xl border m-4 md:m-8 shadow-sm p-3 px-4 sm:px-5 sm:p-4 border-zinc-800 bg-zinc-900">
      <h3 class="font-semibold text-red-300 text-2xl"><slot name="error"></slot></h3>
      <p class="py-2"><slot name="message"></slot></p>
      <div class="pt-4 pb-1 flex gap-2 text-center align-items-center justify-center">
        <a href="/"><button class="bg-red-300 hover:bg-red-400 border border-red-300 text-black py-2 px-4 rounded-xl cursor-pointer shadow-lg transition">Zurück zur Startseite</button></a>
        <slot name="buttons"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>