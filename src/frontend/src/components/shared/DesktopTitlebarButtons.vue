<script setup lang="ts">
import '../../assets/zyneon/css/components/desktop-titlebar-buttons.css';
import "bootstrap-icons/font/bootstrap-icons.min.css"
import { WindowControls } from "../../assets/zyneon/scripts/windowControls.ts"
import {ZyneonSettings} from "../../assets/zyneon/scripts";

const props = withDefaults(
    defineProps<{
      hideInsteadClose?: boolean
    }>(),
    {
      hideInsteadClose: false
    }
)
</script>

<template>
  <div class="titlebar-buttons w-fit absolute right-0 top-0" id="titlebar-buttons" :class="ZyneonSettings.isBorderless ? 'flex' : 'hidden'">
    <button type="button" @click="WindowControls.minimize()" id="titlebar-button-minimize"><i class="icon-minus"></i></button>
    <button type="button" @click="WindowControls.toggleMaximize()" class="smaller" id="titlebar-button-maximize"><i class="icon-square"></i></button>
    <button type="button" @click="WindowControls.close()" class="red" id="titlebar-button-close"><i class="icon-x"></i></button>
  </div>
</template>

<style scoped>
  button {
    border: none;
  }
</style>