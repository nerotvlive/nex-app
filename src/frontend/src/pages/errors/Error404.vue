<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {useRoute} from "vue-router";
import ErrorPage from "./ErrorPage.vue";
const { t } = useI18n()

let url = useRoute().fullPath;
if(url.toLowerCase().endsWith('.html')) {
  url = url.substring(0, url.length - 5);
  window.location.href = url;
}
</script>

<template>
    <ErrorPage>
      <template #error-code>404</template>
      <template #message>{{ t('pages.error.notfound') }}</template>
    </ErrorPage>
</template>