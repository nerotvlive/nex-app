<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import type {PointerInfo, SkinEditor} from "../../assets/zyneon/scripts/skineditor";
import {SkinRenderer2D} from "../../assets/zyneon/scripts/skineditor/renderer2d.ts";

const props = defineProps<{ editor: SkinEditor }>();
const {t} = useI18n();

const container = ref<HTMLDivElement | null>(null);
const zoom = ref(8);
let renderer: SkinRenderer2D | null = null;

let painting = false;
let panning = false;
let middleStart: { x: number, y: number } | null = null;
let lastClient: { x: number, y: number } | null = null;

const brushTools = ['pencil', 'eraser', 'shade', 'noise', 'line'];
const hoverSize = computed(() => brushTools.includes(props.editor.tool) ? props.editor.brushSize : 1);

const syncDocument = () => {
  if (!renderer) return;
  renderer.setLayout(props.editor.layout);
  renderer.setComposite(props.editor.composite);
  syncMask();
};

const syncProblems = () => {
  renderer?.setProblems(props.editor.showProblems ? props.editor.computeProblemMask() : null);
};

const syncMask = () => {
  renderer?.setEditable(props.editor.computeEditableMask());
};

const info = (event: PointerEvent): PointerInfo => ({
  button: event.button === -1 ? 0 : event.button,
  shift: event.shiftKey,
  ctrl: event.ctrlKey || event.metaKey,
  alt: event.altKey,
  pressure: event.pointerType === 'pen' ? event.pressure : undefined
});

const atlasAt = (event: PointerEvent, clamp: boolean) => {
  if (!renderer) return null;
  const hit = renderer.screenToAtlas(event.clientX, event.clientY);
  if (hit || !clamp) return hit;
  const rect = renderer.canvas.getBoundingClientRect();
  const layout = props.editor.layout;
  const x = Math.floor((event.clientX - rect.left - renderer.panX) / renderer.zoom);
  const y = Math.floor((event.clientY - rect.top - renderer.panY) / renderer.zoom);
  return {x: Math.max(0, Math.min(layout.width - 1, x)), y: Math.max(0, Math.min(layout.height - 1, y))};
};

const onPointerDown = (event: PointerEvent) => {
  if (!renderer || !container.value) return;
  container.value.setPointerCapture(event.pointerId);
  lastClient = {x: event.clientX, y: event.clientY};
  if (event.button === 1 || (event.button === 0 && props.editor.navigating)) {
    panning = true;
    if (event.button === 1) middleStart = {x: event.clientX, y: event.clientY};
    return;
  }
  if (event.button !== 0 && event.button !== 2) return;
  const hit = atlasAt(event, false);
  if (!hit) {
    if (event.button === 0) panning = true;
    if (props.editor.tool === 'select') props.editor.deselect();
    return;
  }
  painting = true;
  props.editor.pointerDown({...hit, view: '2d'}, info(event));
};

const onPointerMove = (event: PointerEvent) => {
  if (!renderer) return;
  if (panning && lastClient) {
    renderer.panBy(event.clientX - lastClient.x, event.clientY - lastClient.y);
    lastClient = {x: event.clientX, y: event.clientY};
    return;
  }
  const hit = atlasAt(event, painting);
  renderer.setHover(hit ? {...hit, size: hoverSize.value} : null);
  if (painting) {
    if (hit) props.editor.pointerMove({...hit, view: '2d'}, info(event));
  } else {
    props.editor.hover = hit ? {...hit, view: '2d'} : null;
  }
};

const endPointer = (event: PointerEvent) => {
  if (container.value?.hasPointerCapture(event.pointerId)) container.value.releasePointerCapture(event.pointerId);
  panning = false;
  lastClient = null;
  if (event.button === 1 && middleStart) {
    const start = middleStart;
    middleStart = null;
    if (props.editor.middleClickFills && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 5) {
      const hit = renderer?.screenToAtlas(start.x, start.y);
      if (hit) props.editor.quickFill({...hit, view: '2d'});
    }
  }
  if (painting) {
    painting = false;
    props.editor.pointerUp();
  }
};

const onPointerLeave = () => {
  if (painting) return;
  renderer?.setHover(null);
  props.editor.pointerLeave();
};

const onWheel = (event: WheelEvent) => {
  if (!renderer) return;
  event.preventDefault();
  if (event.ctrlKey || Math.abs(event.deltaY) >= Math.abs(event.deltaX)) {
    renderer.zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.25 : 0.8);
  } else {
    renderer.panBy(-event.deltaX, -event.deltaY);
  }
  zoom.value = renderer.zoom;
};

const fit = () => {
  renderer?.fit();
  zoom.value = renderer?.zoom ?? zoom.value;
};

onMounted(() => {
  if (!container.value) return;
  renderer = new SkinRenderer2D(container.value);
  renderer.setGrid(props.editor.grid, props.editor.guides);
  syncDocument();
  renderer.setSelection(props.editor.selection, props.editor.selectionMask);
  syncProblems();
  container.value.addEventListener('wheel', onWheel, {passive: false});
  zoom.value = renderer.zoom;
});

onBeforeUnmount(() => {
  container.value?.removeEventListener('wheel', onWheel);
  renderer?.dispose();
  renderer = null;
});

watch(() => props.editor.version, syncDocument);
watch(() => [props.editor.activeLayerId, props.editor.selectedParts], syncMask);
watch(() => [props.editor.selection, props.editor.selectionMask], () => renderer?.setSelection(props.editor.selection, props.editor.selectionMask));
watch(() => props.editor.lassoPoints, points => renderer?.setLasso(points));
watch(() => [props.editor.showProblems, props.editor.version], () => syncProblems());
watch(() => props.editor.viewRequest, request => {
  if (!renderer || !request) return;
  if (request.kind === 'fit') renderer.fit();
  else {
    const rect = renderer.canvas.getBoundingClientRect();
    renderer.zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, request.kind === 'zoomIn' ? 1.25 : 0.8);
  }
  zoom.value = renderer.zoom;
});
watch(() => [props.editor.grid, props.editor.guides], () => renderer?.setGrid(props.editor.grid, props.editor.guides));
</script>

<template>
  <div class="skin-editor-viewport relative w-full h-full overflow-hidden" :class="{'navigating': editor.navigating}">
    <div ref="container" class="absolute inset-0" @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="endPointer" @pointercancel="endPointer" @pointerleave="onPointerLeave" @mousedown.middle.prevent @contextmenu.prevent></div>
    <div class="skin-editor-floating absolute bottom-2 left-2 flex items-center gap-1 p-1">
      <button class="skin-editor-icon-btn text-xs px-2" :title="t('pages.skineditor.view.fit')" @click="fit">
        <i class="icon-maximize"></i>
      </button>
      <span class="text-xs px-1 opacity-75">{{ zoom }}×</span>
    </div>
    <span class="skin-editor-view-label absolute top-2 left-2">2D</span>
  </div>
</template>
