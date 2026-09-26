<script setup lang="ts">
  import Error from "@/pages/errors/Error.vue";
  import '@/assets/zyneonstudios/styles/pages/errors/NotFound.css';
  import {onMounted, ref} from "vue";
  import {getApplicationStatus} from "@/assets/zyneonstudios/scripts/types";
  import {openExternal, reportIssue} from "@/assets/zyneonstudios/scripts/shared";

  const url = window.location.href;
  if(url.toLowerCase().endsWith(".html")) {
    window.location.href = url.toLowerCase().replace(".html", "");
  }

  const versionType = ref<string>('uninitialized');
  onMounted(async () => {
    const status = await getApplicationStatus();
    versionType.value = status.version.type;
  });
</script>

<template>
    <Error>
      <template #error>ERROR 404</template>
      <template #message>
        We could not find this application page.<br>
        <br>
        If you think this is an issue, please report it via GitHub.<br>
        <span class="opacity-25">(If it's not already reported)</span><br>
        <br>
        <span>
          <span class="text-blue-300 hover:text-blue-100 transition hover:cursor-pointer" @click="openExternal('https://github.com/nerotvlive/nex-app/issues')">Open issues page</span>
          •
          <span class="text-blue-300 hover:text-blue-100 transition hover:cursor-pointer" @click="reportIssue('Page not found')">Create report</span>
        </span>
        <br>
      </template>
      <template #buttons>
        <a onclick="window.location.reload()"><button class="bg-yellow-300 hover:bg-yellow-400 border border-yellow-300 text-black py-2 px-4 rounded-xl cursor-pointer shadow-lg transition" :class="versionType === 'stable' ? 'hidden' : ''">(DEBUG) Reload page</button></a>
      </template>
    </Error>
</template>