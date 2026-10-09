<script setup lang="ts">
import Card from "./Card.vue";
import {getApiStatus, openExternal} from "../../../assets/zyneon/scripts";
import Badge from "./Badge.vue";
import InputBar from "./InputBar.vue";
import {useI18n} from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <div class="dashboard-header zyn-br-md mb-3 shadow-lg shadow-black/25">
    <Card class="zyn-ov-darker relative overflow-hidden" border="1px solid var(--zyn-ov-brighter-200)">
      <div class="zyn-ov-brighter-200 p-2 px-4 border rounded-t-xl shadow-lg shadow-black/10" style="border-color: var(--zyn-ov-brighter-200)">
          <div class="flex justify-between">
            <strong class="text-white">NEX App</strong>
            <input-bar background="var(--zyn-ov-brighter-200)" :placeholder="t('pages.dashboard.header.search')"/>
          </div>
      </div>
      <div class="flex flex-col gap-3 p-3 relative">
        <div class="flex w-full h-full gap-3">
          <div class="w-full">
            <slot name="top-left">
              <span><span :class="getApiStatus().version.type === 'stable' ? 'hidden' : ''" class="text-lg text-nowrap">{{getApiStatus().version.number}}-{{getApiStatus().version.type}}.{{getApiStatus().version.build}}<br></span><span class="text-md opacity-50">{{getApiStatus().version.name}}</span></span>
            </slot>
          </div>
          <div class="w-full flex flex-col items-end">
            <slot name="top-right">
              <Badge background="var(--color-yellow-300)" class="text-black shadow-lg shadow-black/25" :class="getApiStatus().version.type === 'stable' ? 'hidden' : ''">
                <strong class="text-xs sm:text-sm md:text-md lg:text-lg">
                  {{ t('pages.dashboard.header.unstable') }}
                </strong>
              </Badge>
            </slot>
          </div>

        </div>
        <div class="w-full flex w-full h-full gap-3">

          <div class="w-full">
            <slot name="bottom-left">
              <div class="flex gap-2 mt-8 text-md xl:text-lg">
                <button @click="openExternal('https://www.zyneonapex.com');" class="shadow-lg shadow-black/25">
                  <i class="bi bi-globe mr-1 hidden lg:inline"></i>
                  {{ t('pages.dashboard.header.website') }}
                </button>
                <button @click="openExternal('https://discord.com/invite/hbHDrqUjJ8');" class="shadow-lg shadow-black/25">
                  <i class="bi bi-discord mr-1 hidden lg:inline"></i>
                  {{ t('pages.dashboard.header.discord') }}
                </button>
                <button @click="openExternal('https://github.com/nerotvlive/nex-app');" class="shadow-lg shadow-black/25">
                  <i class="bi bi-github mr-1 hidden lg:inline"></i>
                  {{ t('pages.dashboard.header.github') }}
                </button>
              </div>
            </slot>
          </div>
          <div class="w-full flex flex-col items-end relative">
            <slot name="bottom-right"></slot>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.dashboard-header {
  background: url("../../../assets/zyneon/img/background.jpg") center;
  background-size: cover;
}
</style>