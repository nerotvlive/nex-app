<script setup lang="ts">
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {usePanelState} from "./panelState.ts";
import type {SkinEditor} from "../../assets/zyneon/scripts/skineditor";
import {alphaOf, fromHex, hsvToPacked, hsvToRgb, type Hsv, packedToHsv, toCss, toHex} from "../../assets/zyneon/scripts/skineditor";
import type {PackedColor} from "../../assets/zyneon/scripts/skineditor";

const props = defineProps<{ editor: SkinEditor }>();
const {t} = useI18n();
const collapsed = usePanelState('colors');

const editing = ref<'primary' | 'secondary'>('primary');
const current = computed(() => editing.value === 'primary' ? props.editor.primaryColor : props.editor.secondaryColor);

const hsv = ref<Hsv>(packedToHsv(current.value));
const alpha = ref(alphaOf(current.value));
const hexInput = ref(toHex(current.value));
let lastApplied: PackedColor | null = null;

watch(current, color => {
  if (color === lastApplied) return;
  const next = packedToHsv(color);
  if (next.s === 0 || next.v === 0) next.h = hsv.value.h;
  if (next.v === 0) next.s = hsv.value.s;
  hsv.value = next;
  alpha.value = alphaOf(color);
  hexInput.value = toHex(color);
});

const apply = (remember: boolean = false) => {
  const color = hsvToPacked(hsv.value, alpha.value);
  lastApplied = color;
  if (editing.value === 'primary') props.editor.setPrimaryColor(color, remember);
  else props.editor.setSecondaryColor(color);
  hexInput.value = toHex(color);
};

const setColor = (color: PackedColor) => {
  if (editing.value === 'primary') props.editor.setPrimaryColor(color, true);
  else props.editor.setSecondaryColor(color);
};

const hueCss = computed(() => {
  const [r, g, b] = hsvToRgb(hsv.value.h, 1, 1);
  return `rgb(${r}, ${g}, ${b})`;
});
const opaqueCss = computed(() => {
  const [r, g, b] = hsvToRgb(hsv.value.h, hsv.value.s, hsv.value.v);
  return `rgb(${r}, ${g}, ${b})`;
});

const drag = (event: PointerEvent, update: (x: number, y: number) => void) => {
  const element = event.currentTarget as HTMLElement;
  element.setPointerCapture(event.pointerId);
  const move = (e: PointerEvent) => {
    const rect = element.getBoundingClientRect();
    update(
        Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
        Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
    );
  };
  const up = (e: PointerEvent) => {
    element.removeEventListener('pointermove', move);
    element.removeEventListener('pointerup', up);
    element.removeEventListener('pointercancel', up);
    move(e);
    apply(true);
  };
  element.addEventListener('pointermove', move);
  element.addEventListener('pointerup', up);
  element.addEventListener('pointercancel', up);
  move(event);
};

const dragSaturation = (event: PointerEvent) => drag(event, (x, y) => {
  hsv.value = {...hsv.value, s: x, v: 1 - y};
  apply();
});
const dragHue = (event: PointerEvent) => drag(event, (x) => {
  hsv.value = {...hsv.value, h: x * 360};
  apply();
});
const dragAlpha = (event: PointerEvent) => drag(event, (x) => {
  alpha.value = Math.round(x * 255);
  apply();
});

const commitHex = () => {
  const color = fromHex(hexInput.value);
  if (color === null) {
    hexInput.value = toHex(current.value);
    return;
  }
  setColor(color);
};
</script>

<template>
  <section class="skin-editor-panel">
    <header class="skin-editor-panel-header">
      <button class="skin-editor-panel-toggle" @click="collapsed = !collapsed">
        <i :class="collapsed ? 'icon-chevron-right' : 'icon-chevron-down'"></i>
        <span>{{ t('pages.skineditor.colors.title') }}</span>
      </button>
      <div v-if="collapsed" class="flex gap-1">
        <span class="skin-editor-swatch checker w-5" :title="t('pages.skineditor.colors.primary')"><span :style="{background: toCss(editor.primaryColor)}"></span></span>
        <span class="skin-editor-swatch checker w-5" :title="t('pages.skineditor.colors.secondary')"><span :style="{background: toCss(editor.secondaryColor)}"></span></span>
      </div>
    </header>
    <div v-show="!collapsed" class="flex flex-col gap-2 p-2">
      <div class="flex gap-2">
        <div class="skin-editor-sv grow" :style="{background: hueCss}" @pointerdown="dragSaturation">
          <div class="white"></div>
          <div class="black"></div>
          <div class="cursor" :style="{left: (hsv.s * 100) + '%', top: ((1 - hsv.v) * 100) + '%', background: opaqueCss}"></div>
        </div>
        <div class="flex flex-col gap-1.5 w-14 shrink-0">
          <button class="skin-editor-swatch big checker" :class="{'active': editing === 'primary'}" :title="t('pages.skineditor.colors.primary')" @click="editing = 'primary'">
            <span :style="{background: toCss(editor.primaryColor)}"></span>
          </button>
          <button class="skin-editor-swatch big checker" :class="{'active': editing === 'secondary'}" :title="t('pages.skineditor.colors.secondary')" @click="editing = 'secondary'">
            <span :style="{background: toCss(editor.secondaryColor)}"></span>
          </button>
          <button class="skin-editor-icon-btn small" :title="t('pages.skineditor.colors.swap') + ' (X)'" @click="editor.swapColors()">
            <i class="icon-arrow-left-right"></i>
          </button>
        </div>
      </div>
      <div class="skin-editor-hue" @pointerdown="dragHue">
        <div class="cursor" :style="{left: (hsv.h / 360 * 100) + '%'}"></div>
      </div>
      <div class="skin-editor-alpha checker" @pointerdown="dragAlpha">
        <div class="gradient" :style="{background: `linear-gradient(to right, transparent, ${opaqueCss})`}"></div>
        <div class="cursor" :style="{left: (alpha / 255 * 100) + '%'}"></div>
      </div>
      <div class="flex items-center gap-2">
        <input v-model="hexInput" class="skin-editor-input grow font-mono" spellcheck="false" @keydown.enter="commitHex" @blur="commitHex">
        <span class="text-xs opacity-75 w-10 text-right">{{ Math.round(alpha / 255 * 100) }}%</span>
      </div>

      <div>
        <div class="skin-editor-subtitle" :title="t('pages.skineditor.colors.shadesHint')">{{ t('pages.skineditor.colors.shades') }}</div>
        <div class="flex gap-0.5">
          <button v-for="(color, index) in editor.shadePalette" :key="index" class="skin-editor-swatch grow checker" :class="{'center': index === 3}" :title="toHex(color)" @click="setColor(color)">
            <span :style="{background: toCss(color)}"></span>
          </button>
        </div>
      </div>

      <div v-if="editor.recentColors.length">
        <div class="skin-editor-subtitle">{{ t('pages.skineditor.colors.recent') }}</div>
        <div class="grid grid-cols-8 gap-0.5">
          <button v-for="color in editor.recentColors" :key="color" class="skin-editor-swatch checker" :title="toHex(color)" @click="setColor(color)">
            <span :style="{background: toCss(color)}"></span>
          </button>
        </div>
      </div>

      <div>
        <div class="skin-editor-subtitle">{{ t('pages.skineditor.colors.palette') }}</div>
        <div class="grid grid-cols-8 gap-0.5">
          <button v-for="color in editor.swatches" :key="color" class="skin-editor-swatch" :title="toHex(color)" @click="setColor(color)">
            <span :style="{background: toCss(color)}"></span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
