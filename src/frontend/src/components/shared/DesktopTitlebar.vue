<script setup lang="ts">
  import '../../assets/zyneon/css/components/desktop-titlebar.css';
  import DesktopTitlebarButtons from "./DesktopTitlebarButtons.vue";
  import {WindowControls} from "../../assets/zyneon/scripts/windowControls.ts";

  withDefaults(
      defineProps<{
        title: string
        hideInsteadClose?: boolean
      }>(),
      {
        hideInsteadClose: false
      }
  )
</script>

<template>
  <div class="titlebar min-h-10 max-h-10 w-full" @mousedown="WindowControls.startDrag()">
    <div class="content min-h-10 max-h-10 w-full">
      <div class="start">
        <slot name="start"></slot>
      </div>
      <div class="title w-full flex-1">
        <slot name="title">
          {{ title }}
        </slot>
      </div>
      <div class="end">
        <slot name="end"></slot>
        <div class="window-controls-placeholder"></div>
      </div>
    </div>
    <DesktopTitlebarButtons :hideInsteadClose="hideInsteadClose" @mousedown.stop/>
  </div>
</template>