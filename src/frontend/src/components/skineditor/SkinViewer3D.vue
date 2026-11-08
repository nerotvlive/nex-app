<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import type {BackAccessory, Pose, SkinModel, SkinPreview, SkinSource} from "../../assets/zyneon/scripts/skineditor";
import {getLayout, loadCapeImage, loadSkinPreview} from "../../assets/zyneon/scripts/skineditor";
import {SkinRenderer3D, type TextureImage} from "../../assets/zyneon/scripts/skineditor/renderer3d.ts";

const props = withDefaults(defineProps<{ source: SkinSource | null, model?: SkinModel, pose?: Pose, cape?: SkinSource | null, back?: BackAccessory, controls?: boolean }>(), {pose: 'idle', cape: null, controls: true});
const emit = defineEmits<{ (event: 'error', error: unknown): void }>();
const {t} = useI18n();

const container = ref<HTMLDivElement | null>(null);
const state = ref<'empty' | 'loading' | 'ready' | 'error' | 'unsupported'>('empty');
const pose = ref<Pose>(props.pose);
const model = ref<SkinModel>(props.model ?? 'classic');
const poses: { id: Pose, icon: string }[] = [
  {id: 'stand', icon: 'bi bi-person-standing'},
  {id: 'idle', icon: 'icon-wind'},
  {id: 'walk', icon: 'icon-footprints'}
];
const models: SkinModel[] = ['classic', 'slim'];
const back = ref<BackAccessory>(props.back ?? (props.cape ? 'cape' : 'none'));
const backs: { id: BackAccessory, icon: string }[] = [
  {id: 'cape', icon: 'icon-flag'},
  {id: 'elytra', icon: 'icon-feather'}
];
let capeImage: TextureImage | null = null;
let capeRequest = 0;
let renderer: SkinRenderer3D | null = null;
let preview: SkinPreview | null = null;
let request = 0;

const load = async () => {
  const current = ++request;
  if (!renderer) return;
  if (!props.source) {
    state.value = 'empty';
    return;
  }
  state.value = 'loading';
  try {
    const loaded = await loadSkinPreview(props.source, props.model);
    if (current !== request || !renderer) return;
    preview = loaded;
    model.value = loaded.model;
    renderer.setLayout(loaded.layout);
    renderer.updateTexture(loaded.composite);
    state.value = 'ready';
  } catch (error) {
    if (current !== request) return;
    state.value = 'error';
    emit('error', error);
  }
};

const applyBack = () => renderer?.setBackAccessory(back.value, capeImage);

const hasCape = ref(false);

const loadCape = async () => {
  const current = ++capeRequest;
  if (!props.cape) {
    capeImage = null;
    hasCape.value = false;
    back.value = 'none';
    applyBack();
    return;
  }
  try {
    const image = await loadCapeImage(props.cape);
    if (current !== capeRequest) return;
    capeImage = image;
    hasCape.value = true;
    if (back.value === 'none') back.value = 'cape';
    applyBack();
  } catch (error) {
    if (current !== capeRequest) return;
    capeImage = null;
    hasCape.value = false;
    back.value = 'none';
    applyBack();
    emit('error', error);
  }
};

onMounted(() => {
  if (!container.value) return;
  if (!SkinRenderer3D.isSupported()) {
    state.value = 'unsupported';
    return;
  }
  try {
    renderer = new SkinRenderer3D(container.value);
  } catch (error) {
    console.error('[SkinViewer] WebGL initialisation failed', error);
    state.value = 'unsupported';
    return;
  }
  renderer.setShading(true);
  renderer.setTurntable(true);
  renderer.setPose(pose.value);
  applyBack();
  void load();
  void loadCape();
});

onBeforeUnmount(() => {
  request++;
  renderer?.dispose();
  renderer = null;
});

watch(() => [props.source, props.model], () => void load());
watch(() => props.pose, value => pose.value = value);
watch(() => props.back, value => {
  if (value) back.value = value;
});
watch(() => props.cape, () => void loadCape());
watch(back, applyBack);
watch(pose, value => renderer?.setPose(value));
watch(model, value => {
  if (!renderer || !preview) return;
  renderer.setLayout(getLayout(preview.format, value));
  renderer.updateTexture(preview.composite);
});
</script>

<template>
  <div class="skin-viewer" :class="state" @mousedown.stop>
    <div v-if="controls && state === 'ready'" class="skin-viewer-top">
      <div v-if="hasCape" class="skin-viewer-segmented">
        <button v-for="entry in backs" :key="entry.id" :class="{'active': back === entry.id}" :title="t('pages.skins.viewer.back.' + entry.id)" @click="back = entry.id"><i :class="entry.icon"></i></button>
      </div>
      <div class="skin-viewer-segmented skin-viewer-poses">
        <button v-for="entry in poses" :key="entry.id" :class="{'active': pose === entry.id}" :title="t('pages.skins.viewer.pose.' + entry.id)" @click="pose = entry.id"><i :class="entry.icon"></i></button>
      </div>
    </div>
    <div class="skin-viewer-stage">
      <div ref="container" class="skin-viewer-canvas"></div>
      <i v-if="state === 'loading'" class="icon-loader-circle skin-viewer-status animate-spin"></i>
      <i v-else-if="state === 'error' || state === 'unsupported'" class="icon-image-off skin-viewer-status"></i>
    </div>
    <div v-if="controls && state === 'ready'" class="skin-viewer-segmented skin-viewer-models">
      <button v-for="entry in models" :key="entry" :class="{'active': model === entry}" @click="model = entry">{{ t('pages.skins.viewer.model.' + entry) }}</button>
    </div>
  </div>
</template>

<style scoped>
.skin-viewer {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
  min-width: 0;
  min-height: 0;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  &.empty, &.error, &.unsupported {
    cursor: default;
  }
}

.skin-viewer-stage {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
}

.skin-viewer.empty .skin-viewer-canvas, .skin-viewer.error .skin-viewer-canvas {
  visibility: hidden;
}

.skin-viewer-canvas {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
}

.skin-viewer-top {
  display: flex;
  justify-content: space-between;
  gap: 0.35rem;
  margin: 0.5rem 0.5rem 0.25rem;
  cursor: default;
}

.skin-viewer-poses {
  margin-left: auto;
}

.skin-viewer-models {
  margin: 0 0.5rem 0.5rem;
  cursor: default;

  button {
    flex: 1 1 0;
  }
}

.skin-viewer-segmented {
  display: inline-flex;
  min-width: 0;
  padding: 2px;
  gap: 2px;
  border-radius: var(--zyn-br-sm);
  background: var(--zyn-ov-darker-300);
  border: 1px solid var(--zyn-ov-brighter-200);

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.6rem;
    height: 1.5rem;
    padding: 0 0.4rem;
    border-radius: calc(var(--zyn-br-sm) - 2px);
    font-size: 0.75rem;
    white-space: nowrap;
    cursor: pointer;
    color: var(--zyn-foreground);
    transition: var(--zyn-transition);

    &:hover {
      background: var(--zyn-ov-brighter-200);
      color: var(--zyn-foreground-alt);
    }

    &.active {
      background: var(--zyn-ov-brighter-400);
      color: white;
    }
  }
}

.skin-viewer-status {
  position: absolute;
  inset: 0;
  margin: auto;
  width: fit-content;
  height: fit-content;
  font-size: 1.5rem;
  opacity: 0.5;
  pointer-events: none;
}
</style>
