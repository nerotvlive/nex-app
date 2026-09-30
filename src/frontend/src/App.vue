<script setup lang="ts">
import Menu from "@/components/Menu.vue";
import Titlebar from "@/components/Titlebar.vue";
import {useGlobalGamepadNavigation} from "@/assets/zyneonstudios/scripts/gamepad";
useGlobalGamepadNavigation()
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <Titlebar />
    <div class="grow overflow-hidden flex">
      <Menu class="overflow-y-auto" />
      <div class="grow overflow-y-auto zyn-bg border-l border-t content relative shadow-overlay rounded-tl-2xl overflow-hidden">
        <router-view class="" />
      </div>
    </div>
  </div>
</template>