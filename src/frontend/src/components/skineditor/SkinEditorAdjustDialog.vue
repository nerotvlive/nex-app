<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, reactive, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import type {Adjustment, AdjustmentKind, AdjustScope, PackedColor, SkinEditor} from "../../assets/zyneon/scripts/skineditor";
import {defaultAdjustment, toCss} from "../../assets/zyneon/scripts/skineditor";
import {vDraggable} from "./draggable.ts";

const props = defineProps<{ editor: SkinEditor, kind: AdjustmentKind, scope: AdjustScope, colors: PackedColor[] | null }>();
const emit = defineEmits<{ (event: 'close'): void }>();
const {t} = useI18n();

interface Slider {
  key: 'brightness' | 'contrast' | 'hue' | 'saturation' | 'lightness' | 'levels';
  min: number;
  max: number;
}

const sliders: Record<string, Slider[]> = {
  brightnessContrast: [{key: 'brightness', min: -100, max: 100}, {key: 'contrast', min: -100, max: 100}],
  hueSaturation: [{key: 'hue', min: -180, max: 180}, {key: 'saturation', min: -100, max: 100}, {key: 'lightness', min: -100, max: 100}],
  posterize: [{key: 'levels', min: 2, max: 16}]
};

const adjustment = reactive<Adjustment>(defaultAdjustment(props.kind));
const scope = ref<AdjustScope>(props.colors ? 'image' : props.scope);
const preview = ref(true);
const hasLayer = computed(() => !!props.editor.activeLayer);

const update = () => {
  if (preview.value) props.editor.previewAdjustment({...adjustment}, scope.value, props.colors);
  else props.editor.cancelPreview();
};

watch(() => [adjustment, scope.value, preview.value], update, {deep: true});

const reset = () => Object.assign(adjustment, defaultAdjustment(props.kind));

const confirm = () => {
  props.editor.previewAdjustment({...adjustment}, scope.value, props.colors);
  props.editor.commitPreview(props.colors ? 'pages.skineditor.history.recolor' : 'pages.skineditor.history.adjust.' + props.kind);
  emit('close');
};

const cancel = () => {
  props.editor.cancelPreview();
  emit('close');
};

const onKey = (event: KeyboardEvent) => {
  if ((event.target as HTMLElement | null)?.tagName === 'INPUT' && event.key !== 'Enter' && event.key !== 'Escape') return;
  if (event.key === 'Escape') cancel();
  else if (event.key === 'Enter') confirm();
  else return;
  event.preventDefault();
  event.stopPropagation();
};

onMounted(() => {
  window.addEventListener('keydown', onKey, true);
  update();
});

onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true));
</script>

<template>
  <div class="skin-editor-modal-backdrop transparent" @pointerdown.self="cancel">
    <div v-draggable class="skin-editor-modal">
      <header class="flex items-center gap-2">
        <i class="icon-sliders-horizontal"></i>
        <strong class="text-white grow">{{ t('pages.skineditor.adjust.' + kind) }}</strong>
        <button class="skin-editor-icon-btn" @click="cancel"><i class="icon-x"></i></button>
      </header>

      <div v-if="colors" class="flex flex-wrap items-center gap-1">
        <span class="text-sm opacity-75 mr-1">{{ t('pages.skineditor.palette.recolorTarget', {count: colors.length}) }}</span>
        <span v-for="color in colors.slice(0, 24)" :key="color" class="skin-editor-swatch checker w-4"><span :style="{background: toCss(color)}"></span></span>
      </div>
      <div v-else class="skin-editor-segmented">
        <button class="grow" :class="{'active': scope === 'layer'}" :disabled="!hasLayer" @click="scope = 'layer'">{{ t('pages.skineditor.adjust.scope.layer') }}</button>
        <button class="grow" :class="{'active': scope === 'image'}" @click="scope = 'image'">{{ t('pages.skineditor.adjust.scope.image') }}</button>
      </div>

      <div class="flex flex-col gap-2">
        <label v-for="slider in sliders[kind] ?? []" :key="slider.key" class="skin-editor-slider-row">
          <span class="opacity-75">{{ t('pages.skineditor.adjust.fields.' + slider.key) }}</span>
          <input type="range" :min="slider.min" :max="slider.max" step="1" v-model.number="adjustment[slider.key]" class="skin-editor-range">
          <input type="number" :min="slider.min" :max="slider.max" v-model.number="adjustment[slider.key]" class="skin-editor-input">
        </label>
        <label v-if="kind === 'hueSaturation'" class="flex items-center gap-2 text-sm cursor-pointer" :title="t('pages.skineditor.adjust.fields.colorizeHint')">
          <input type="checkbox" v-model="adjustment.colorize" class="accent-[var(--zyn-accent)]">
          <span>{{ t('pages.skineditor.adjust.fields.colorize') }}</span>
        </label>
      </div>

      <p class="text-xs opacity-60">{{ t('pages.skineditor.adjust.limits') }}</p>

      <footer class="flex items-center gap-2">
        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" v-model="preview" class="accent-[var(--zyn-accent)]">
          <span>{{ t('pages.skineditor.adjust.preview') }}</span>
        </label>
        <button v-if="sliders[kind]" class="skin-editor-icon-btn" :title="t('pages.skineditor.adjust.reset')" @click="reset"><i class="icon-rotate-ccw"></i></button>
        <div class="grow"></div>
        <button class="zyn-btn compact darker" @click="cancel">{{ t('pages.skineditor.dialog.cancel') }}</button>
        <button class="zyn-btn compact accent" @click="confirm">{{ t('pages.skineditor.dialog.apply') }}</button>
      </footer>
    </div>
  </div>
</template>
