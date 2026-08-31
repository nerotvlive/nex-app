<script setup lang="ts">

</script>

<template>
  <div class="dashboard h-full flex flex-col">
    <div class="header flex p-4 text-xl justify-between">
      <div class="flex flex-col justify-between">
        <div>
          <strong>NEX App</strong><br>
          <span class="text-lg">26.0.0-revision.1<br><span class="text-sm opacity-50">Reditus Magnificus</span></span>
        </div>
        <strong class="bg-yellow-200 text-lg text-black w-fit px-2 rounded-lg">BETA BUILD</strong>
      </div>
      <div class="flex flex-col justify-between text-sm">
        <div class="flex justify-end">
          <input type="text" placeholder="Search resources..." class="bg-zinc-500/25 hover:bg-zinc-400/25 text-white h-fit w-fit font-bold py-2 px-4 rounded transition shadow-lg shadow-black/25">
        </div>
        <div class="flex gap-2">
          <button class="bg-zinc-500/25 hover:bg-zinc-400/25 text-white h-fit font-bold py-2 px-4 rounded transition shadow-lg shadow-black/25 hover:cursor-pointer"><i class="bi bi-globe"></i> Website</button>
          <button class="bg-zinc-500/25 hover:bg-zinc-400/25 text-white h-fit font-bold py-2 px-4 rounded transition shadow-lg shadow-black/25 hover:cursor-pointer"><i class="bi bi-github"></i> Discord</button>
          <button class="bg-zinc-500/25 hover:bg-zinc-400/25 text-white h-fit font-bold py-2 px-4 rounded transition shadow-lg shadow-black/25 hover:cursor-pointer"><i class="bi bi-github"></i> GitHub</button>
        </div>
      </div>
    </div>
    <div class="content bg-zinc-900 grow border-t border-zinc-800 p-4">
      <strong>Last instances</strong>
    </div>
  </div>
</template>

<style scoped>
div.dashboard {
  background: url("../assets/zyneonstudios/images/background.jpg");
  background-size: cover;

  .header {
    height: 12rem;
    background: linear-gradient(to top, transparent, #00000099);
  }
}
</style>