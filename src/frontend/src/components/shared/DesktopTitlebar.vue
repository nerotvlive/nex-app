<script setup lang="ts">
  import '../../assets/zyneon/css/components/desktop-titlebar.css';
  import DesktopTitlebarButtons from "./DesktopTitlebarButtons.vue";
  import {WindowControls, ZyneonSettings} from "../../assets/zyneon/scripts";

  withDefaults(
      defineProps<{
        title?: string
        hideInsteadClose?: boolean
      }>(),
      {
        title: "NEX App",
        hideInsteadClose: false
      }
  )
</script>

<template>
  <div class="titlebar min-h-10 max-h-10 w-full flex" @mousedown="WindowControls.startDrag()">
    <div class="content min-h-10 max-h-10 w-full">
      <div class="start">
        <slot name="start"></slot>
      </div>
      <div class="title w-full absolute flex items-center justify-center pointer-events-none">
        <slot name="title">
          <span :class="ZyneonSettings.isBorderless ? '' : 'hidden'">{{ title }}</span>
        </slot>
      </div>
      <div class="end grow">
        <slot name="end"></slot>
        <div class="window-controls-placeholder"></div>
      </div>
    </div>
    <DesktopTitlebarButtons :hideInsteadClose="hideInsteadClose" @mousedown.stop>
      <template #additional-buttons>
        <slot name="additional-buttons"></slot>
      </template>
    </DesktopTitlebarButtons>
  </div>
</template>