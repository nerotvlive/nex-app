<script setup lang="ts">
import Card from "./Card.vue";
import {getApiStatus, openExternal} from "../../../assets/zyneon/scripts";
import Badge from "./Badge.vue";
import InputBar from "./InputBar.vue";
import {useI18n} from "vue-i18n";

const { t } = useI18n();

const props = withDefaults(
    defineProps<{
      backgroundOverride?: string
      borderOverride?: string
      disabled?: boolean
    }>(),
    {
      backgroundOverride: "transparent",
      borderOverride: "1px solid var(--zyn-ov-brighter-200)",
      disabled: false
    }
)
</script>

<template>
  <div class="dashboard-header zyn-br-md mb-3 shadow-lg shadow-black/25">
    <Card class="relative overflow-hidden" :backgroundOverride="'transparent'" :borderOverride="borderOverride" :disabled="disabled">
      <div class="header-background absolute inset-0"></div>
      <div class="header-overlay" :style="{background: backgroundOverride}">
        <div class="zyn-ov-brighter-200 p-2 px-2 border-b shadow-lg shadow-black/10" style="border-color: var(--zyn-ov-brighter-100)">
          <div class="flex justify-between">
            <strong class="text-white text-xl p-0.5"><slot name="title">{{ t("pages.dashboard.title") }}</slot></strong>
            <input-bar background="var(--zyn-ov-darker-300)" :placeholder="t('pages.dashboard.header.search')"/>
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
                  <button @click="openExternal('https://www.zyneonapex.com');" class="zyn-btn">
                    <i class="bi bi-globe mr-1 hidden lg:inline"></i>
                    {{ t('pages.dashboard.header.website') }}
                  </button>
                  <button @click="openExternal('https://discord.com/invite/Q2AEWfesZW');" class="zyn-btn">
                    <i class="bi bi-discord mr-1 hidden lg:inline"></i>
                    {{ t('pages.dashboard.header.discord') }}
                  </button>
                  <button @click="openExternal('https://github.com/nerotvlive/nex-app');" class="zyn-btn">
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
      </div>
    </Card>
  </div>
</template>

<style scoped>
.dashboard-header {
  .header-background {
    position: absolute;
    top: 0; left: 0;
    bottom: 0; right: 0;
    z-index: -1;
    background: center
    radial-gradient(ellipse 160% 130% at 10% 10%, rgba(255, 20, 147, 0.15), transparent 60%),
    radial-gradient(ellipse 160% 130% at 90% 90%, rgba(138, 43, 226, 0.18), transparent 65%),
    radial-gradient(ellipse 110% 50% at 80% 30%, rgba(255, 215, 0, 0.08), transparent 40%),
    #000000;
  }

  .header-overlay {
    z-index: 0;
  }
}
</style>