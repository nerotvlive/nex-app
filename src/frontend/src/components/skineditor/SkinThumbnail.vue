<script setup lang="ts">
import {ref, watch} from "vue";
import type {SkinModel, SkinOutfit} from "../../assets/zyneon/scripts/skineditor";
import {outfitThumbnail} from "../../assets/zyneon/scripts/skineditor";

const props = defineProps<{ outfit: SkinOutfit | null }>();
const emit = defineEmits<{ (event: 'model', model: SkinModel): void }>();

const url = ref<string | null>(null);
const failed = ref(false);

watch(() => props.outfit?.source, async () => {
  url.value = null;
  failed.value = false;
  if (!props.outfit) return;
  const outfit = props.outfit;
  try {
    const thumbnail = await outfitThumbnail(outfit);
    if (props.outfit !== outfit) return;
    url.value = thumbnail.url;
    emit('model', thumbnail.model);
  } catch {
    failed.value = true;
  }
}, {immediate: true});
</script>

<template>
  <div class="skin-thumbnail">
    <img v-if="url" :src="url" alt="" draggable="false">
    <i v-else-if="failed" class="icon-image-off"></i>
    <i v-else-if="!outfit" class="bi bi-person"></i>
  </div>
</template>

<style scoped>
.skin-thumbnail {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 2;
  opacity: 0.95;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    image-rendering: pixelated;
  }

  i {
    opacity: 0.4;
  }
}
</style>
