<script setup lang="ts">
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import type {SkinEditor} from "../../assets/zyneon/scripts/skineditor";
import type {SkinFormat, SkinModel} from "../../assets/zyneon/scripts/skineditor";
import {vDraggable} from "./draggable.ts";

const props = defineProps<{ editor: SkinEditor }>();
const emit = defineEmits<{ (event: 'close'): void }>();
const {t} = useI18n();

const format = ref<SkinFormat>(props.editor.doc.format === 'legacy' ? 'modern' : props.editor.doc.format);
const model = ref<SkinModel>(props.editor.doc.model);

const unchanged = computed(() => format.value === props.editor.doc.format && model.value === props.editor.doc.model);
const lossy = computed(() => (props.editor.doc.format === 'modern' && format.value === 'legacy') || (props.editor.doc.model === 'classic' && model.value === 'slim'));

const apply = () => {
  props.editor.convert(format.value, model.value);
  emit('close');
};
</script>

<template>
  <div class="skin-editor-modal-backdrop" @pointerdown.self="emit('close')">
    <div v-draggable class="skin-editor-modal">
      <header class="flex items-center gap-2">
        <i class="icon-refresh-cw"></i>
        <strong class="text-white grow">{{ t('pages.skineditor.convert.title') }}</strong>
        <button class="skin-editor-icon-btn" @click="emit('close')"><i class="icon-x"></i></button>
      </header>
      <p class="text-sm opacity-80">{{ t('pages.skineditor.convert.description') }}</p>
      <p class="text-sm">
        {{ t('pages.skineditor.convert.current') }}:
        <strong class="text-white">{{ editor.doc.format === 'legacy' ? '64×32' : '64×64' }}, {{ t('pages.skineditor.model.' + editor.doc.model) }}</strong>
      </p>

      <div class="flex flex-col gap-1">
        <span class="skin-editor-subtitle">{{ t('pages.skineditor.convert.format') }}</span>
        <div class="skin-editor-segmented">
          <button class="grow" :class="{'active': format === 'modern'}" @click="format = 'modern'">64×64 (1.8+)</button>
          <button class="grow" :class="{'active': format === 'legacy'}" @click="format = 'legacy'">64×32 ({{ t('pages.skineditor.convert.legacy') }})</button>
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <span class="skin-editor-subtitle">{{ t('pages.skineditor.convert.model') }}</span>
        <div class="skin-editor-segmented">
          <button class="grow" :class="{'active': model === 'classic'}" @click="model = 'classic'">{{ t('pages.skineditor.model.classic') }}</button>
          <button class="grow" :class="{'active': model === 'slim'}" @click="model = 'slim'">{{ t('pages.skineditor.model.slim') }}</button>
        </div>
      </div>

      <p v-if="lossy" class="text-sm zyn-text-warning flex gap-2"><i class="icon-triangle-alert"></i>{{ t('pages.skineditor.convert.lossy') }}</p>
      <p class="text-xs opacity-60">{{ t('pages.skineditor.convert.undoHint') }}</p>

      <footer class="flex justify-end gap-2">
        <button class="zyn-btn compact darker" @click="emit('close')">{{ t('pages.skineditor.dialog.cancel') }}</button>
        <button class="zyn-btn compact accent" :class="{'disabled': unchanged}" :disabled="unchanged" @click="apply">{{ t('pages.skineditor.convert.apply') }}</button>
      </footer>
    </div>
  </div>
</template>
