<script setup lang="ts">
import {onBeforeUnmount, onMounted, reactive, watch} from "vue";
import {useI18n} from "vue-i18n";
import type {ShadingOptions, ShadingStyle, SkinEditor} from "../../assets/zyneon/scripts/skineditor";
import {DEFAULT_SHADING} from "../../assets/zyneon/scripts/skineditor";
import {vDraggable} from "./draggable.ts";

const props = defineProps<{ editor: SkinEditor }>();
const emit = defineEmits<{ (event: 'close'): void }>();
const {t} = useI18n();

const options = reactive<ShadingOptions>({...DEFAULT_SHADING});
const styles: ShadingStyle[] = ['smooth', 'dither'];

watch(options, value => props.editor.previewAutoShade({...value}), {deep: true});

const confirm = () => {
  props.editor.commitPreview('pages.skineditor.history.autoShade');
  emit('close');
};

const cancel = () => {
  props.editor.cancelPreview();
  emit('close');
};

const onKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') cancel();
  else if (event.key === 'Enter') confirm();
  else return;
  event.preventDefault();
  event.stopPropagation();
};

onMounted(() => {
  window.addEventListener('keydown', onKey, true);
  props.editor.beginAutoShade();
  props.editor.previewAutoShade({...options});
});

onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true));
</script>

<template>
  <div class="skin-editor-modal-backdrop transparent" @pointerdown.self="cancel">
    <div v-draggable class="skin-editor-modal">
      <header class="flex items-center gap-2">
        <i class="icon-sparkles"></i>
        <strong class="text-white grow">{{ t('pages.skineditor.layers.autoShade') }}</strong>
        <button class="skin-editor-icon-btn" @click="cancel"><i class="icon-x"></i></button>
      </header>
      <p class="text-sm opacity-80">{{ t('pages.skineditor.autoShade.hint') }}</p>

      <div class="skin-editor-segmented">
        <button v-for="style in styles" :key="style" class="grow" :class="{'active': options.style === style}" @click="options.style = style">{{ t('pages.skineditor.autoShade.style.' + style) }}</button>
      </div>

      <label class="skin-editor-slider-row">
        <span class="opacity-75">{{ t('pages.skineditor.autoShade.strength') }}</span>
        <input type="range" min="0" max="1" step="0.05" v-model.number="options.strength" class="skin-editor-range">
        <span class="text-right">{{ Math.round(options.strength * 100) }}%</span>
      </label>
      <label class="skin-editor-slider-row">
        <span class="opacity-75">{{ t('pages.skineditor.autoShade.highlight') }}</span>
        <input type="range" min="0" max="1" step="0.05" v-model.number="options.highlight" class="skin-editor-range">
        <span class="text-right">{{ Math.round(options.highlight * 100) }}%</span>
      </label>
      <label class="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" v-model="options.edges" class="accent-[var(--zyn-accent)]">
        <span>{{ t('pages.skineditor.autoShade.edges') }}</span>
      </label>
      <label class="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" v-model="options.overlay" class="accent-[var(--zyn-accent)]">
        <span>{{ t('pages.skineditor.autoShade.overlay') }}</span>
      </label>

      <footer class="flex justify-end gap-2">
        <button class="zyn-btn compact darker" @click="cancel">{{ t('pages.skineditor.dialog.cancel') }}</button>
        <button class="zyn-btn compact accent" @click="confirm">{{ t('pages.skineditor.dialog.apply') }}</button>
      </footer>
    </div>
  </div>
</template>
