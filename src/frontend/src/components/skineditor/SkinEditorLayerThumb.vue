<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, watch} from "vue";
import type {PixelLayer} from "../../assets/zyneon/scripts/skineditor";
import type {SkinLayout} from "../../assets/zyneon/scripts/skineditor";
import {renderLayerToAtlas} from "../../assets/zyneon/scripts/skineditor";

const props = defineProps<{ layer: PixelLayer, layout: SkinLayout, version: number }>();
const canvas = ref<HTMLCanvasElement | null>(null);
let timer: number | null = null;

const draw = () => {
  timer = null;
  const element = canvas.value;
  if (!element) return;
  const layout = props.layout;
  if (element.width !== layout.width || element.height !== layout.height) {
    element.width = layout.width;
    element.height = layout.height;
  }
  const context = element.getContext('2d');
  if (!context) return;
  const pixels = renderLayerToAtlas(props.layer, layout);
  context.putImageData(new ImageData(new Uint8ClampedArray(pixels), layout.width, layout.height), 0, 0);
};

const schedule = () => {
  if (timer !== null) return;
  timer = window.setTimeout(draw, 150);
};

onMounted(draw);
onBeforeUnmount(() => {
  if (timer !== null) clearTimeout(timer);
});
watch(() => [props.version, props.layer, props.layout], schedule);
</script>

<template>
  <canvas ref="canvas" class="skin-editor-thumb checker"></canvas>
</template>
