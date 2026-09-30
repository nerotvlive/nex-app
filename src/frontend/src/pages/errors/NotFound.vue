<script setup lang="ts">
  import Error from "@/pages/errors/Error.vue";
  import '@/assets/zyneonstudios/styles/pages/errors/NotFound.css';
  import {onMounted, ref} from "vue";
  import {getApplicationStatus} from "@/assets/zyneonstudios/scripts/types";
  import {openExternal, reportIssue} from "@/assets/zyneonstudios/scripts/shared";

  const showPopup = ref<boolean>(false);

  const currentPath = window.location.pathname;
  const url = window.location.href;
  if(url.toLowerCase().endsWith(".html")) {
    window.location.href = url.toLowerCase().replace(".html", "");
  }

  const reportButton = ref<HTMLButtonElement | null>(null);
  const reportTitle = ref<HTMLSpanElement | null>(null);
  const rereportDescription = ref<HTMLSpanElement | null>(null);
  const handleReport = async () => {
    if(reportButton.value) {
      reportButton.value.innerText = 'Generating report...';
      reportButton.value.disabled = true;
      reportButton.value.classList.add('disabled');
      reportButton.value.classList.remove("bg-blue-300","hover:bg-blue-400","border-blue-300");
    }
    if(reportTitle.value) {
      reportTitle.value.innerText = 'Generating report...';
    }
    await reportIssue('Page not found: '+currentPath,`When attempting to access the page \`` + currentPath + `\` the NEX App answers with the 404 error code (page not found). This issue description is pre-written and exported by the NEX App.`)
    if(reportButton.value) {
      reportButton.value.innerText = 'Regenerate and open new issue report';
      reportButton.value.disabled = false;
      reportButton.value.classList.remove('disabled');
      reportButton.value.classList.add("bg-yellow-300","hover:bg-yellow-400","border-yellow-300");
    }
    if(reportTitle.value) {
      reportTitle.value.innerText = 'Issue report generated and opened!';
    }
    if(rereportDescription.value) {
      rereportDescription.value.innerHTML = '<br><span class="text-amber-100">You already have generated an issue report.</span> <span class="text-amber-200">Please do not report issues more than once!</span><br><br>If you have accidentally closed it, you can regenerate and open a new issue report.<br>Please remember to add more information to the generated issue.<br>';
    }
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
          <span class="text-blue-300 hover:text-blue-100 transition hover:cursor-pointer" @click="showPopup = true;">Create report</span>
        </span>
        <br>
      </template>
      <template #buttons>
        <a onclick="window.location.reload()"><button class="bg-yellow-300 hover:bg-yellow-400 border border-yellow-300 text-black py-2 px-4 rounded-xl cursor-pointer shadow-lg transition" :class="versionType === 'stable' ? 'hidden' : ''">(DEBUG) Reload page</button></a>
      </template>
    </Error>
    <div class="error-report-pop-up absolute z-10 top-0 bottom-0 left-0 right-0 justify-center items-center text-center" :class="showPopup ? 'flex' : 'hidden'">
      <div class="border border-zinc-700 bg-zinc-800 scale-95 sm:scale-80 p-4 sm:p-12 md:scale-100 lg:p-16 rounded-xl shadow-lg shadow-black/25">
        <span class="text-2xl font-extrabold" ref="reportTitle">Report issue?</span><br>
        <br>
        <span>
          <strong>Attention: </strong> The app will generate system and app information and an issue description.<br>
          <span ref="rereportDescription">Please add more information to the generated issue.<br></span>
          <span class="opacity-25">(How did you get to this page?, What did you expect to happen/see? etc.)</span>
        </span><br>
        <br>
        <br>
        <div class="flex flex-col md:flex-row gap-2 justify-center">
          <button @click="showPopup = false" class="bg-red-300 hover:bg-red-400 border border-red-300 text-black py-2 px-4 rounded-xl cursor-pointer shadow-lg transition">Cancel report</button>
          <button ref="reportButton" @click="handleReport();" class="bg-blue-300 hover:bg-blue-400 border border-blue-300 text-black py-2 px-4 rounded-xl cursor-pointer shadow-lg transition" :class="versionType === 'stable' ? 'hidden' : ''">Generate and open issue report</button>
        </div>
      </div>
    </div>
</template>