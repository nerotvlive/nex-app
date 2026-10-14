<script setup lang="ts">
import {useI18n} from "vue-i18n";
import ErrorPage from "./ErrorPage.vue";
const { t } = useI18n()
</script>

<template>
    <ErrorPage>
      <template #error-code>501</template>
      <template #message>{{ t('pages.error.notimplemented') }}</template>
    </ErrorPage>
</template>