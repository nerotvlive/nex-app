<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import type {PointerInfo, SkinEditor} from "../../assets/zyneon/scripts/skineditor";
import {type CameraPreset, type Hit3D, SkinRenderer3D} from "../../assets/zyneon/scripts/skineditor/renderer3d.ts";

const props = defineProps<{ editor: SkinEditor }>();
const {t} = useI18n();

const container = ref<HTMLDivElement | null>(null);
const supported = ref(true);
let renderer: SkinRenderer3D | null = null;

let painting = false;
let rotatingWithLeft = false;
let lastClient: { x: number, y: number } | null = null;
let lastTexel: { x: number, y: number } | null = null;
let hoverFrame = 0;

const presets: { id: CameraPreset, label: string }[] = [
  {id: 'front', label: 'pages.skineditor.view.front'},
  {id: 'back', label: 'pages.skineditor.view.back'},
  {id: 'left', label: 'pages.skineditor.view.left'},
  {id: 'right', label: 'pages.skineditor.view.right'},
  {id: 'iso', label: 'pages.skineditor.view.iso'}
];

const syncDocument = () => {
  if (!renderer) return;
  renderer.setLayout(props.editor.layout);
  renderer.updateTexture(props.editor.composite);
};

const syncParts = () => {
  renderer?.setPartState({
    selected: props.editor.selectedParts,
    overlay: props.editor.overlayVisible,
    mode: props.editor.hiddenPartMode
  });
};

const info = (event: PointerEvent): PointerInfo => ({
  button: event.button === -1 ? 0 : event.button,
  shift: event.shiftKey,
  ctrl: event.ctrlKey || event.metaKey,
  alt: event.altKey,
  pressure: event.pointerType === 'pen' ? event.pressure : undefined
});

const pick = (event: PointerEvent | MouseEvent): Hit3D | null => {
  if (!renderer) return null;
  return renderer.pick(event.clientX, event.clientY, props.editor.activeTarget, props.editor.composite);
};

const toPointerHit = (hit: Hit3D) => ({x: hit.x, y: hit.y, part: hit.part, view: '3d' as const});

let middleStart: { x: number, y: number } | null = null;

const onPointerDown = (event: PointerEvent) => {
  if (event.button === 1) middleStart = {x: event.clientX, y: event.clientY};
  if (!renderer || event.button !== 0) return;
  if (props.editor.navigating) return;
  const hit = pick(event);
  if (!hit) {
    rotatingWithLeft = true;
    renderer.setLeftMouseNavigation(true);
    return;
  }
  painting = true;
  lastClient = {x: event.clientX, y: event.clientY};
  lastTexel = {x: hit.x, y: hit.y};
  container.value?.setPointerCapture(event.pointerId);
  props.editor.pointerDown(toPointerHit(hit), info(event));
  renderer.setHover(hit);
};

const onPointerMove = (event: PointerEvent) => {
  if (!renderer) return;
  if (painting && lastClient) {
    const dx = event.clientX - lastClient.x, dy = event.clientY - lastClient.y;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 3));
    let last: Hit3D | null = null;
    for (let i = 1; i <= steps; i++) {
      const x = lastClient.x + dx * i / steps, y = lastClient.y + dy * i / steps;
      const hit = renderer.pick(x, y, props.editor.activeTarget, props.editor.composite);
      if (!hit) continue;
      last = hit;
      if (lastTexel && lastTexel.x === hit.x && lastTexel.y === hit.y) continue;
      lastTexel = {x: hit.x, y: hit.y};
      props.editor.pointerMove(toPointerHit(hit), info(event));
    }
    lastClient = {x: event.clientX, y: event.clientY};
    renderer.setHover(last);
    return;
  }
  if (event.buttons !== 0) {
    renderer.setHover(null);
    return;
  }
  if (hoverFrame) return;
  const clientX = event.clientX, clientY = event.clientY;
  hoverFrame = requestAnimationFrame(() => {
    hoverFrame = 0;
    if (!renderer) return;
    const hit = renderer.pick(clientX, clientY, props.editor.activeTarget, props.editor.composite);
    renderer.setHover(hit);
    props.editor.hover = hit ? toPointerHit(hit) : null;
  });
};

const endPointer = (event: PointerEvent) => {
  if (event.button === 1 && middleStart) {
    const start = middleStart;
    middleStart = null;
    if (renderer && props.editor.middleClickFills && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 5) {
      const hit = renderer.pick(start.x, start.y, props.editor.activeTarget, props.editor.composite);
      if (hit) props.editor.quickFill(toPointerHit(hit));
    }
  }
  if (rotatingWithLeft) {
    rotatingWithLeft = false;
    renderer?.setLeftMouseNavigation(props.editor.navigating);
  }
  if (painting) {
    painting = false;
    lastClient = null;
    lastTexel = null;
    if (container.value?.hasPointerCapture(event.pointerId)) container.value.releasePointerCapture(event.pointerId);
    props.editor.pointerUp();
  }
};

const onPointerLeave = () => {
  if (painting) return;
  renderer?.setHover(null);
  props.editor.pointerLeave();
};

const setPreset = (preset: CameraPreset) => renderer?.setCameraPreset(preset);

onMounted(() => {
  if (!container.value) return;
  if (!SkinRenderer3D.isSupported()) {
    supported.value = false;
    return;
  }
  try {
    renderer = new SkinRenderer3D(container.value);
  } catch (error) {
    console.error('[SkinEditor] WebGL initialisation failed', error);
    supported.value = false;
    return;
  }
  renderer.setShading(props.editor.shading);
  renderer.setLeftMouseNavigation(props.editor.navigating);
  syncDocument();
  syncParts();
});

onBeforeUnmount(() => {
  if (hoverFrame) cancelAnimationFrame(hoverFrame);
  renderer?.dispose();
  renderer = null;
});

watch(() => props.editor.version, syncDocument);
watch(() => [props.editor.selectedParts, props.editor.overlayVisible, props.editor.hiddenPartMode], syncParts);
watch(() => props.editor.shading, value => renderer?.setShading(value));
watch(() => props.editor.navigating, value => renderer?.setLeftMouseNavigation(value));
watch(() => props.editor.viewRequest, request => {
  if (request?.kind === 'fit') renderer?.setCameraPreset('iso');
});
watch(() => props.editor.activeLayerId, () => renderer?.setHover(null));
watch(() => props.editor.pose, pose => renderer?.setPose(pose));
watch(() => [props.editor.backAccessory, props.editor.capeImage], () => renderer?.setBackAccessory(props.editor.backAccessory, props.editor.capeImage));
watch(() => props.editor.backAccessory, (kind, previous) => {
  if (kind !== 'none' && previous === 'none') setPreset('back');
});
watch(() => props.editor.voxelOverlay, value => renderer?.setVoxelOverlay(value));
</script>

<template>
  <div class="skin-editor-viewport relative w-full h-full overflow-hidden" :class="{'navigating': editor.navigating}">
    <div ref="container" class="absolute inset-0" @pointerdown.capture="onPointerDown" @pointermove="onPointerMove" @pointerup="endPointer" @pointercancel="endPointer" @pointerleave="onPointerLeave" @mousedown.middle.prevent @contextmenu.prevent></div>
    <div v-if="!supported" class="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
      <i class="icon-triangle-alert text-2xl zyn-text-warning"></i>
      <strong class="text-white">{{ t('pages.skineditor.view.noWebgl') }}</strong>
      <span class="text-sm opacity-75">{{ t('pages.skineditor.view.noWebglHint') }}</span>
    </div>
    <div v-else class="skin-editor-floating absolute bottom-2 left-2 flex gap-1 p-1">
      <button v-for="preset in presets" :key="preset.id" class="skin-editor-icon-btn text-xs px-2" :title="t(preset.label)" @click="setPreset(preset.id)">
        {{ t(preset.label) }}
      </button>
    </div>
    <span class="skin-editor-view-label absolute top-2 left-2">3D</span>
  </div>
</template>
