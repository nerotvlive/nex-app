<script setup lang="ts">
import {useI18n} from "vue-i18n";
import {usePanelState} from "./panelState.ts";
import {PART_IDS, type PartId} from "../../assets/zyneon/scripts/skineditor";
import type {HiddenPartMode, SkinEditor} from "../../assets/zyneon/scripts/skineditor";

const props = defineProps<{ editor: SkinEditor }>();
const {t} = useI18n();
const collapsed = usePanelState('parts');

const figure: Record<PartId, { x: number, y: number, w: number, h: number }> = {
  head: {x: 4, y: 0, w: 8, h: 8},
  body: {x: 4, y: 8, w: 8, h: 12},
  rightArm: {x: 0, y: 8, w: 4, h: 12},
  leftArm: {x: 12, y: 8, w: 4, h: 12},
  rightLeg: {x: 4, y: 20, w: 4, h: 12},
  leftLeg: {x: 8, y: 20, w: 4, h: 12}
};

const modes: { id: HiddenPartMode, icon: string }[] = [
  {id: 'hide', icon: 'icon-eye-off'},
  {id: 'ghost', icon: 'icon-scan'},
  {id: 'lock', icon: 'icon-lock'}
];

const isSelected = (part: PartId) => props.editor.selectedParts.includes(part);

const toggleOverlay = (part: PartId) => props.editor.setOverlayVisible(part, !props.editor.overlayVisible[part]);

const select = (part: PartId, event: MouseEvent) => {
  props.editor.selectPart(part, event.shiftKey || event.ctrlKey || event.metaKey);
};
</script>

<template>
  <section class="skin-editor-panel" :class="{'collapsed': collapsed}">
    <header class="skin-editor-panel-header">
      <button class="skin-editor-panel-toggle" @click="collapsed = !collapsed">
        <i :class="collapsed ? 'icon-chevron-right' : 'icon-chevron-down'"></i>
        <span>{{ t('pages.skineditor.parts.title') }}</span>
      </button>
      <div class="flex gap-0.5">
        <button class="zyn-btn compact" :class="{'active-alt': editor.allOverlaysVisible}" :title="t('pages.skineditor.parts.overlayAll')" @click="editor.setOverlayVisible('all', !editor.allOverlaysVisible)">
          <i class="icon-shirt"></i>
        </button>
        <button class="zyn-btn compact text-xs px-2" :class="{'active-alt': editor.allPartsSelected}" @click="editor.selectAllParts()" :title="'0'">
          {{ t('pages.skineditor.parts.all') }}
        </button>
      </div>
    </header>
    <div v-show="!collapsed" class="flex gap-3 p-2">
      <svg class="skin-editor-figure shrink-0" viewBox="-0.5 -0.5 17 33" width="68" height="132">
        <rect v-for="part in PART_IDS" :key="part" :x="figure[part].x" :y="figure[part].y" :width="figure[part].w" :height="figure[part].h" :class="{'selected': isSelected(part), 'overlay-off': !editor.overlayVisible[part]}" @click="select(part, $event)" @contextmenu.prevent="toggleOverlay(part)">
          <title>{{ t('pages.skineditor.parts.' + part) }} · {{ t('pages.skineditor.parts.figureHint') }}</title>
        </rect>
      </svg>
      <div class="flex flex-col gap-0.5 grow min-w-0">
        <div v-for="(part, index) in PART_IDS" :key="part" class="skin-editor-part-row" :class="{'selected': isSelected(part)}">
          <button class="grow text-left truncate" @click="select(part, $event)" @contextmenu.prevent="toggleOverlay(part)" :title="t('pages.skineditor.parts.selectHint') + ' (' + (index + 1) + ')'">
            {{ t('pages.skineditor.parts.' + part) }}
          </button>
          <button class="zyn-btn compact" :class="{'muted transparent': !editor.overlayVisible[part]}" :title="t('pages.skineditor.parts.overlayToggle')" @click="editor.setOverlayVisible(part, !editor.overlayVisible[part])">
            <i :class="editor.overlayVisible[part] ? 'icon-shirt' : 'icon-user'"></i>
          </button>
        </div>
      </div>
    </div>
    <div v-show="!collapsed" class="px-2 pb-2">
      <div class="skin-editor-segmented w-full" :title="t('pages.skineditor.parts.modeHint')">
        <button v-for="mode in modes" :key="mode.id" class="flex-1 min-w-0" :class="{'active': editor.hiddenPartMode === mode.id}" @click="editor.hiddenPartMode = mode.id">
          <i :class="mode.icon"></i><span class="truncate">{{ t('pages.skineditor.parts.mode.' + mode.id) }}</span>
        </button>
      </div>
    </div>
  </section>
</template>
