<script setup lang="ts">
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import type {FillMode, RectMode, SkinEditor} from "../../assets/zyneon/scripts/skineditor";

const props = defineProps<{ editor: SkinEditor }>();
const {t} = useI18n();

const tool = computed(() => props.editor.tool);
const hasBrush = computed(() => ['pencil', 'eraser', 'shade', 'noise', 'line'].includes(tool.value));
const hasSelectionActions = computed(() => tool.value === 'select' || tool.value === 'move' || !!props.editor.selection);

const fillModes: FillMode[] = ['face', 'part', 'global'];
const rectModes: RectMode[] = ['outline', 'filled'];
</script>

<template>
  <div class="skin-editor-options flex items-center gap-3 px-3 py-1 text-sm overflow-x-auto">
    <strong class="text-white whitespace-nowrap">{{ t('pages.skineditor.tools.' + tool + '.name') }}</strong>

    <label v-if="hasBrush" class="flex items-center gap-2 whitespace-nowrap">
      <span class="opacity-75">{{ t('pages.skineditor.options.size') }}</span>
      <input type="range" min="1" max="8" step="1" v-model.number="editor.brushSize" class="skin-editor-range w-24">
      <span class="w-6 text-center">{{ editor.brushSize }}</span>
    </label>

    <div v-if="tool === 'fill'" class="skin-editor-segmented">
      <button v-for="mode in fillModes" :key="mode" :class="{'active': editor.fillMode === mode}" :title="t('pages.skineditor.options.fill.' + mode + 'Hint')" @click="editor.fillMode = mode">
        {{ t('pages.skineditor.options.fill.' + mode) }}
      </button>
    </div>

    <div v-if="tool === 'rect'" class="skin-editor-segmented">
      <button v-for="mode in rectModes" :key="mode" :class="{'active': editor.rectMode === mode}" @click="editor.rectMode = mode">
        {{ t('pages.skineditor.options.rect.' + mode) }}
      </button>
    </div>

    <div v-if="tool === 'shade'" class="skin-editor-segmented" :title="t('pages.skineditor.options.shade.hint')">
      <button :class="{'active': editor.shadeDirection === -1}" @click="editor.shadeDirection = -1">
        <i class="icon-moon"></i> {{ t('pages.skineditor.options.shade.darken') }}
      </button>
      <button :class="{'active': editor.shadeDirection === 1}" @click="editor.shadeDirection = 1">
        <i class="icon-sun"></i> {{ t('pages.skineditor.options.shade.lighten') }}
      </button>
    </div>

    <label v-if="tool === 'noise'" class="flex items-center gap-2 whitespace-nowrap">
      <span class="opacity-75">{{ t('pages.skineditor.options.noise') }}</span>
      <input type="range" min="0.05" max="0.8" step="0.05" v-model.number="editor.noiseAmount" class="skin-editor-range w-24">
      <span class="w-8 text-center">{{ Math.round(editor.noiseAmount * 100) }}%</span>
    </label>

    <div v-if="hasSelectionActions" class="flex items-center gap-1">
      <button class="skin-editor-icon-btn" :title="t('pages.skineditor.options.selection.copy') + ' (Ctrl+C)'" @click="editor.copySelection(false)"><i class="icon-copy"></i></button>
      <button class="skin-editor-icon-btn" :title="t('pages.skineditor.options.selection.cut') + ' (Ctrl+X)'" @click="editor.copySelection(true)"><i class="icon-scissors"></i></button>
      <button class="skin-editor-icon-btn" :title="t('pages.skineditor.options.selection.paste') + ' (Ctrl+V)'" @click="editor.paste()"><i class="icon-clipboard-paste"></i></button>
      <button class="skin-editor-icon-btn" :title="t('pages.skineditor.options.selection.delete') + ' (Del)'" @click="editor.deleteSelection()"><i class="icon-trash-2"></i></button>
      <button class="skin-editor-icon-btn" :title="t('pages.skineditor.options.selection.flipH')" @click="editor.flipSelection('horizontal')"><i class="icon-flip-horizontal-2"></i></button>
      <button class="skin-editor-icon-btn" :title="t('pages.skineditor.options.selection.flipV')" @click="editor.flipSelection('vertical')"><i class="icon-flip-vertical-2"></i></button>
      <button v-if="editor.selection" class="skin-editor-icon-btn" :title="t('pages.skineditor.options.selection.deselect') + ' (Ctrl+D)'" @click="editor.deselect()"><i class="icon-x"></i></button>
    </div>

    <div class="grow"></div>

    <label class="flex items-center gap-2 whitespace-nowrap cursor-pointer" :title="t('pages.skineditor.tools.mirrorHint')">
      <input type="checkbox" v-model="editor.mirror" class="accent-[var(--zyn-accent)]">
      <span>{{ t('pages.skineditor.tools.mirror') }}</span>
    </label>
    <button class="zyn-btn compact darker whitespace-nowrap" :title="t('pages.skineditor.tools.mirrorSideHint')" @click="editor.mirrorToOtherSide()">
      <i class="icon-flip-horizontal"></i>
      <span>{{ t('pages.skineditor.tools.mirrorSide') }}</span>
    </button>
  </div>
</template>
