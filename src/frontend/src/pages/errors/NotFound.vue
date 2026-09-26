<script setup lang="ts">
  import Error from "@/pages/errors/Error.vue";
  import '@/assets/zyneonstudios/styles/pages/errors/NotFound.css';

  const url = window.location.href;
  if(url.toLowerCase().endsWith(".html")) {
    window.location.href = url.toLowerCase().replace(".html", "");
  }
</script>

<template>
    <Error>
      <template #error>Fehler 404</template>
      <template #message>Wir konnten diese Seite leider nicht finden...</template>
    </Error>
</template>