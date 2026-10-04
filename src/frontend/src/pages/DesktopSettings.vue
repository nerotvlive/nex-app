<script setup lang="ts">
import '../assets/zyneon/css/settings.css';
import { ZyneonSettings } from "../assets/zyneon/scripts/settings.ts";

const handleRoundedCorners = (isRange: boolean, e: Event) => {
  const target = e.target as HTMLInputElement;
  ZyneonSettings.setRoundedCorners(isRange, parseFloat(target.value));
};

const handleBgAccentOpacity = (isRange: boolean, e: Event) => {
  const target = e.target as HTMLInputElement;
  ZyneonSettings.setBackgroundAccentOpacity(isRange, parseFloat(target.value));
};

const handleBgAccent = (e: Event) => {
  const target = e.target as HTMLInputElement;
  ZyneonSettings.setBackgroundAccent(target.value);
};

const handleBgColor = (e: Event) => {
  const target = e.target as HTMLInputElement;
  ZyneonSettings.setBackgroundColor(target.value);
};

const handleClassicMenu = (e: Event) => {
  const target = e.target as HTMLInputElement;
  ZyneonSettings.setClassicMenu(target.checked);
};
</script>

<template>
  <div class="w-full h-full p-3">
    <h1 class="text-2xl font-bold">Settings</h1>

    <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md my-2">
      <div class="flex w-full">
        <strong>Border radius base value </strong>
      </div>
      <div class="flex w-full justify-end align-middle items-center">
        <input id="background-rounded-number" type="number" min="0" max="2" step="0.01"
               :value="ZyneonSettings.getRoundedCorners()"
               @input="e => handleRoundedCorners(false, e)" />
        <input id="background-rounded-range" type="range" min="0" max="2" step="0.01"
               :value="ZyneonSettings.getRoundedCorners()"
               @input="e => handleRoundedCorners(true, e)" />
      </div>
    </div>

    <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md my-2">
      <div class="flex w-full">
        <strong>Background accent opacity </strong>
      </div>
      <div class="flex w-full justify-end align-middle items-center">
        <input id="background-accOp-number" type="number" min="0" max="0.99" step="0.01"
               :value="ZyneonSettings.getBackgroundAccentOpacity()"
               @input="e => handleBgAccentOpacity(false, e)" />
        <input id="background-accOp-range" type="range" min="0" max="0.99" step="0.01"
               :value="ZyneonSettings.getBackgroundAccentOpacity()"
               @input="e => handleBgAccentOpacity(true, e)" />
      </div>
    </div>

    <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md my-2">
      <div class="flex w-full">
        <strong>Background accent color</strong>
      </div>
      <div class="flex w-full justify-end align-middle items-center">
        <input type="color" class="w-10 h-10 cursor-pointer rounded border-none bg-transparent"
               :value="ZyneonSettings.getBackgroundAccent()"
               @input="handleBgAccent" />
      </div>
    </div>

    <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md my-2">
      <div class="flex w-full">
        <strong>Background base color</strong>
      </div>
      <div class="flex w-full justify-end align-middle items-center">
        <input type="color" class="w-10 h-10 cursor-pointer rounded border-none bg-transparent"
               :value="ZyneonSettings.getBackgroundColor()"
               @input="handleBgColor" />
      </div>
    </div>

    <div class="flex w-full zyn-ov-darker-500 p-2 zyn-br-md my-2"
         @click="(e) => (e.currentTarget as HTMLElement).querySelector('input')?.click()">
      <div class="flex w-full">
        <strong>Use Overlaying Contrast Menu & Titlebar</strong>
      </div>
      <div class="flex w-full justify-end align-middle items-center">
        <input class="pointer-events-disabled mr-1" type="checkbox"
               :checked="ZyneonSettings.useClassicMenu"
               @change="handleClassicMenu" />
      </div>
    </div>
  </div>
</template>