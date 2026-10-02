<script setup lang="ts">
import '../assets/zyneon/css/settings.css';
import { ZyneonSettings } from "../assets/zyneon/script/settings.ts";
</script>

<template>
  <div class="w-full h-full p-3">
    <h1 class="text-2xl font-bold">Settings</h1>

    <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md my-2">
      <div class="flex w-full">
        <strong>Border radius base value </strong>
      </div>
      <div class="flex w-full justify-end align-middle items-center">
        <input id="background-rounded-number" type="number" min="0" max="2" step="0.01" :value="ZyneonSettings.getRoundedCorners()" @input="(e) => ZyneonSettings.setRoundedCorners(false,parseFloat((e.target as HTMLInputElement).value))"/>
        <input id="background-rounded-range" type="range" min="0" max="2" step="0.01" :value="ZyneonSettings.getRoundedCorners()" @input="(e) => ZyneonSettings.setRoundedCorners(true,parseFloat((e.target as HTMLInputElement).value))"/>
      </div>
    </div>

    <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md my-2">
      <div class="flex w-full">
        <strong>Background accent opacity </strong>
      </div>
      <div class="flex w-full justify-end align-middle items-center">
        <input id="background-accOp-number" type="number" min="0" max="0.99" step="0.01" :value="ZyneonSettings.getBackgroundAccentOpacity()" @input="(e) => ZyneonSettings.setBackgroundAccentOpacity(false,parseFloat((e.target as HTMLInputElement).value))"/>
        <input id="background-accOp-range" type="range" min="0" max="0.99" step="0.01" :value="ZyneonSettings.getBackgroundAccentOpacity()" @input="(e) => ZyneonSettings.setBackgroundAccentOpacity(true,parseFloat((e.target as HTMLInputElement).value))"/>
      </div>
    </div>

    <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md my-2">
      <div class="flex w-full">
        <strong>Background accent color</strong>
      </div>
      <div class="flex w-full justify-end align-middle items-center">
        <input type="color" class="w-10 h-10 cursor-pointer rounded border-none bg-transparent" @input="(e) => ZyneonSettings.setBackgroundAccent((e.target as HTMLInputElement).value)" :value="ZyneonSettings.getBackgroundAccent()"/>
      </div>
    </div>

    <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md my-2">
      <div class="flex w-full">
        <strong>Background base color</strong>
      </div>
      <div class="flex w-full justify-end align-middle items-center">
        <input type="color" class="w-10 h-10 cursor-pointer rounded border-none bg-transparent" @input="(e) => ZyneonSettings.setBackgroundColor((e.target as HTMLInputElement).value)" :value="ZyneonSettings.getBackgroundColor()"/>
      </div>
    </div>

    <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md my-2" onclick="this.querySelector('input').click();">
      <div class="flex w-full">
        <strong>Use Overlaying Contrast Menu & Titlebar</strong>
      </div>
      <div class="flex w-full justify-end align-middle items-center">
        <input class="pointer-events-disabled mr-1" type="checkbox" :checked="ZyneonSettings.useClassicMenu" @change="(e) => ZyneonSettings.setClassicMenu((e.target as HTMLInputElement).checked)"/>
      </div>
    </div>
  </div>
</template>