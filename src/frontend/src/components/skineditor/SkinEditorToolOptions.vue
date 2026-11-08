<script setup lang="ts">
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import type {BackAccessory, FillMode, Pose, PressureMode, RectMode, SkinEditor, WandMode} from "../../assets/zyneon/scripts/skineditor";

const props = defineProps<{ editor: SkinEditor }>();
const {t} = useI18n();

const tool = computed(() => props.editor.tool);
const hasBrush = computed(() => ['pencil', 'eraser', 'shade', 'noise', 'dither', 'line'].includes(tool.value));
const hasPressure = computed(() => ['pencil', 'eraser', 'shade', 'noise', 'dither'].includes(tool.value));
const isSelectTool = computed(() => ['select', 'lasso', 'wand'].includes(tool.value));
const percent = (value: number) => Math.round(value * 100) + '%';
const hasSelectionActions = computed(() => tool.value === 'select' || tool.value === 'move' || !!props.editor.selection);

const fillModes: FillMode[] = ['face', 'part', 'global'];
const rectModes: RectMode[] = ['outline', 'filled'];
const pressureModes: PressureMode[] = ['off', 'opacity', 'size'];
const wandModes: WandMode[] = ['color', 'face', 'part'];
const densities = [0.25, 0.5, 0.75];
const poses: { id: Pose, icon: string }[] = [
  {id: 'stand', icon: 'bi bi-person-standing'},
  {id: 'idle', icon: 'icon-wind'},
  {id: 'walk', icon: 'icon-footprints'},
  {id: 'tpose', icon: 'bi bi-person-arms-up'}
];
const backs: BackAccessory[] = ['none', 'cape', 'elytra'];

const scrollOptions = (event: WheelEvent) => {
  const element = event.currentTarget as HTMLElement;
  if (element.scrollWidth <= element.clientWidth || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
  element.scrollLeft += event.deltaY;
  event.preventDefault();
};
</script>

<template>
  <div class="skin-editor-options flex items-center gap-3 px-3 text-sm">
    <div class="skin-editor-options-scroll flex items-center gap-3 grow min-w-0" @wheel="scrollOptions">
      <strong class="text-white whitespace-nowrap">{{ t('pages.skineditor.tools.' + tool + '.name') }}</strong>

      <label v-if="hasBrush" class="flex items-center gap-2 whitespace-nowrap">
        <span class="opacity-75">{{ t('pages.skineditor.options.size') }}</span>
        <input type="range" min="1" max="8" step="1" v-model.number="editor.brushSize" class="skin-editor-range w-24">
        <span class="w-6 text-center">{{ editor.brushSize }}</span>
      </label>

      <label v-if="tool === 'pencil' || tool === 'line'" class="flex items-center gap-2 whitespace-nowrap" :title="t('pages.skineditor.options.pencilOpacityHint')">
        <span class="opacity-75">{{ t('pages.skineditor.options.pencilOpacity') }}</span>
        <input type="range" min="0.05" max="1" step="0.05" v-model.number="editor.pencilOpacity" class="skin-editor-range w-24">
        <span class="w-9 text-center">{{ percent(editor.pencilOpacity) }}</span>
      </label>

      <template v-if="tool === 'dither'">
        <div class="skin-editor-segmented" :title="t('pages.skineditor.options.dither.densityHint')">
          <button v-for="density in densities" :key="density" :class="{'active': editor.ditherDensity === density}" @click="editor.ditherDensity = density">{{ percent(density) }}</button>
        </div>
        <label class="flex items-center gap-2 whitespace-nowrap cursor-pointer" :title="t('pages.skineditor.options.dither.fillGapsHint')">
          <input type="checkbox" v-model="editor.ditherFillGaps" class="accent-[var(--zyn-accent)]">
          <span>{{ t('pages.skineditor.options.dither.fillGaps') }}</span>
        </label>
      </template>

      <label v-if="tool === 'eraser'" class="flex items-center gap-2 whitespace-nowrap" :title="t('pages.skineditor.options.eraserOpacityHint')">
        <span class="opacity-75">{{ t('pages.skineditor.options.eraserOpacity') }}</span>
        <input type="range" min="0.05" max="1" step="0.05" v-model.number="editor.eraserOpacity" class="skin-editor-range w-24">
        <span class="w-9 text-center">{{ percent(editor.eraserOpacity) }}</span>
      </label>

      <template v-if="tool === 'gradient'">
        <div class="skin-editor-segmented" :title="t('pages.skineditor.options.gradient.areaHint')">
          <button v-for="mode in fillModes" :key="mode" :class="{'active': editor.gradientArea === mode}" :title="t('pages.skineditor.options.fill.' + mode + 'Hint')" @click="editor.gradientArea = mode">{{ t('pages.skineditor.options.fill.' + mode) }}</button>
        </div>
        <label class="flex items-center gap-2 whitespace-nowrap" :title="t('pages.skineditor.options.gradient.stepsHint')">
          <span class="opacity-75">{{ t('pages.skineditor.options.gradient.steps') }}</span>
          <input type="range" min="1" max="12" step="1" v-model.number="editor.gradientSteps" class="skin-editor-range w-24">
          <span class="w-14 text-center">{{ editor.gradientSteps < 2 ? t('pages.skineditor.options.gradient.smooth') : editor.gradientSteps }}</span>
        </label>
        <label class="flex items-center gap-2 whitespace-nowrap cursor-pointer" :title="t('pages.skineditor.options.gradient.ditherHint')">
          <input type="checkbox" v-model="editor.gradientDither" class="accent-[var(--zyn-accent)]">
          <span>{{ t('pages.skineditor.options.gradient.dither') }}</span>
        </label>
      </template>

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

      <label v-if="tool === 'shade'" class="flex items-center gap-2 whitespace-nowrap" :title="t('pages.skineditor.options.shadeStrengthHint')">
        <span class="opacity-75">{{ t('pages.skineditor.options.shadeStrength') }}</span>
        <input type="range" min="0.1" max="1" step="0.05" v-model.number="editor.shadeStrength" class="skin-editor-range w-24">
        <span class="w-9 text-center">{{ percent(editor.shadeStrength) }}</span>
      </label>

      <label v-if="tool === 'noise'" class="flex items-center gap-2 whitespace-nowrap">
        <span class="opacity-75">{{ t('pages.skineditor.options.noise') }}</span>
        <input type="range" min="0.05" max="0.8" step="0.05" v-model.number="editor.noiseAmount" class="skin-editor-range w-24">
        <span class="w-8 text-center">{{ Math.round(editor.noiseAmount * 100) }}%</span>
      </label>

      <template v-if="tool === 'wand'">
        <div class="skin-editor-segmented" :title="t('pages.skineditor.options.wand.modeHint')">
          <button v-for="mode in wandModes" :key="mode" :class="{'active': editor.wandMode === mode}" @click="editor.wandMode = mode">{{ t('pages.skineditor.options.wand.' + mode) }}</button>
        </div>
        <label v-if="editor.wandMode === 'color'" class="flex items-center gap-2 whitespace-nowrap" :title="t('pages.skineditor.options.wand.toleranceHint')">
          <span class="opacity-75">{{ t('pages.skineditor.options.wand.tolerance') }}</span>
          <input type="range" min="0" max="128" step="1" v-model.number="editor.wandTolerance" class="skin-editor-range w-24">
          <span class="w-8 text-center">{{ editor.wandTolerance }}</span>
        </label>
        <label v-if="editor.wandMode === 'color'" class="flex items-center gap-2 whitespace-nowrap cursor-pointer">
          <input type="checkbox" v-model="editor.wandContiguous" class="accent-[var(--zyn-accent)]">
          <span>{{ t('pages.skineditor.options.wand.contiguous') }}</span>
        </label>
        <label v-if="editor.wandMode === 'color'" class="flex items-center gap-2 whitespace-nowrap cursor-pointer" :title="t('pages.skineditor.options.wand.allLayersHint')">
          <input type="checkbox" v-model="editor.wandAllLayers" class="accent-[var(--zyn-accent)]">
          <span>{{ t('pages.skineditor.options.wand.allLayers') }}</span>
        </label>
      </template>

      <span v-if="isSelectTool" class="opacity-60 whitespace-nowrap text-xs">{{ t('pages.skineditor.options.selection.modifiers') }}</span>

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

      <label v-if="hasPressure && editor.penDetected" class="flex items-center gap-2 whitespace-nowrap" :title="t('pages.skineditor.options.pressure.hint')">
        <i class="icon-pen-tool opacity-75"></i>
        <select class="skin-editor-input text-xs" v-model="editor.pressureMode">
          <option v-for="mode in pressureModes" :key="mode" :value="mode" class="bg-black text-white">{{ t('pages.skineditor.options.pressure.' + mode) }}</option>
        </select>
      </label>

      <div v-if="editor.viewMode !== '2d'" class="flex items-center gap-1 absolute right-2">
        <button v-for="pose in poses" :key="pose.id" class="zyn-btn compact transparent" :class="{'active-alt': editor.pose === pose.id}" :title="t('pages.skineditor.preview.pose.' + pose.id)" @click="editor.pose = pose.id">
          <i class="mt-px" :class="pose.icon"></i>
        </button>
        <select class="skin-editor-input text-xs" v-model="editor.backAccessory" :title="t('pages.skineditor.preview.backHint')">
          <option v-for="back in backs" :key="back" :value="back" class="bg-black text-white">{{ t('pages.skineditor.preview.back.' + back) }}</option>
        </select>
        <button v-if="editor.backAccessory !== 'none'" class="zyn-btn compact transparent" :title="t('pages.skineditor.preview.loadCape')" @click="editor.loadCape()">
          <i class="icon-folder-open"></i>
        </button>
        <button class="zyn-btn compact transparent" :class="{'active-alt': editor.voxelOverlay}" :title="t('pages.skineditor.preview.voxel')" @click="editor.voxelOverlay = !editor.voxelOverlay">
          <i class="icon-boxes"></i>
        </button>
      </div>
    </div>
  </div>
</template>
