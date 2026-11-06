<script setup lang="ts">
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {usePanelState} from "./panelState.ts";
import type {PackedColor, SkinEditor} from "../../assets/zyneon/scripts/skineditor";
import {toCss, toHex} from "../../assets/zyneon/scripts/skineditor";

const props = defineProps<{ editor: SkinEditor }>();
const {t} = useI18n();
const collapsed = usePanelState('palette');

const palette = computed(() => collapsed.value ? [] : props.editor.skinPalette);
const selection = computed(() => props.editor.paletteSelection);
const count = computed(() => {
  void props.editor.version;
  return collapsed.value ? 0 : props.editor.skinPalette.length;
});

const click = (event: MouseEvent, color: PackedColor) => {
  if (event.altKey) {
    props.editor.setPrimaryColor(color, true);
    return;
  }
  props.editor.togglePaletteColor(color, event.ctrlKey || event.metaKey || event.shiftKey);
};

const recolor = () => props.editor.openAdjustment('hueSaturation', 'image', [...selection.value]);

const replace = () => props.editor.replacePaletteColors([...selection.value], props.editor.primaryColor);

const selectPixels = () => {
  if (selection.value.length) props.editor.selectColorRange([...selection.value]);
};
</script>

<template>
  <section class="skin-editor-panel" :class="{'collapsed': collapsed}">
    <header class="skin-editor-panel-header">
      <button class="skin-editor-panel-toggle" @click="collapsed = !collapsed">
        <i :class="collapsed ? 'icon-chevron-right' : 'icon-chevron-down'"></i>
        <span>{{ t('pages.skineditor.palette.title') }}</span>
      </button>
      <span v-if="!collapsed" class="text-xs opacity-60 font-normal">{{ t('pages.skineditor.palette.count', {count}) }}</span>
    </header>
    <div v-show="!collapsed" class="flex flex-col gap-2 p-2">
      <div class="skin-editor-palette">
        <button v-for="entry in palette" :key="entry.color" class="skin-editor-swatch checker" :class="{'selected': selection.includes(entry.color)}" :title="toHex(entry.color) + ' · ' + t('pages.skineditor.palette.pixels', {count: entry.count})" @click="click($event, entry.color)" @dblclick="editor.setPrimaryColor(entry.color, true)">
          <span :style="{background: toCss(entry.color)}"></span>
        </button>
      </div>
      <span v-if="!palette.length" class="text-xs opacity-60">{{ t('pages.skineditor.palette.empty') }}</span>
      <span v-else-if="!selection.length" class="text-xs opacity-60">{{ t('pages.skineditor.palette.hint') }}</span>
      <div v-else class="flex flex-wrap gap-1">
        <button class="skin-editor-icon-btn" :title="t('pages.skineditor.palette.similar')" @click="editor.selectSimilarPaletteColors()"><i class="icon-swatch-book"></i></button>
        <button class="skin-editor-icon-btn" :title="t('pages.skineditor.palette.selectPixels')" @click="selectPixels"><i class="icon-square-dashed"></i></button>
        <button class="skin-editor-icon-btn" :title="t('pages.skineditor.palette.recolor')" @click="recolor"><i class="icon-droplets"></i></button>
        <button class="skin-editor-icon-btn" :title="t('pages.skineditor.palette.replace')" @click="replace"><i class="icon-replace"></i></button>
        <div class="grow"></div>
        <button class="skin-editor-icon-btn" :title="t('pages.skineditor.palette.clear')" @click="editor.paletteSelection = []"><i class="icon-x"></i></button>
      </div>
    </div>
  </section>
</template>
