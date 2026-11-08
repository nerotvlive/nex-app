<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import type {SkinEditor} from "../../assets/zyneon/scripts/skineditor/editor.ts";
import type {LayerNode} from "../../assets/zyneon/scripts/skineditor/document.ts";
import {BLEND_MODES, type LayerTarget} from "../../assets/zyneon/scripts/skineditor/types.ts";
import SkinEditorLayerThumb from "./SkinEditorLayerThumb.vue";

const props = defineProps<{ editor: SkinEditor }>();
const {t} = useI18n();

interface Row {
  node: LayerNode;
  depth: number;
  hiddenByParent: boolean;
}

const targets: { id: LayerTarget, short: string }[] = [
  {id: 'base', short: 'B'},
  {id: 'overlay', short: 'O'},
  {id: 'atlas', short: 'A'}
];

const targetShort = (node: LayerNode) => node.kind === 'layer' ? targets.find(target => target.id === node.target)?.short ?? '' : '';

const rows = computed<Row[]>(() => {
  void props.editor.version;
  const out: Row[] = [];
  const walk = (nodes: LayerNode[], depth: number, hiddenByParent: boolean) => {
    for (const node of nodes) {
      out.push({node, depth, hiddenByParent});
      if (node.kind === 'group' && !node.collapsed) walk(node.children, depth + 1, hiddenByParent || !node.visible);
    }
  };
  walk(props.editor.doc.layers, 0, false);
  return out;
});

const active = computed(() => {
  void props.editor.version;
  return props.editor.activeNode;
});

const activeLayer = computed(() => active.value && active.value.kind === 'layer' ? active.value : null);
const formatSupportsOverlay = computed(() => props.editor.doc.format === 'modern');
const selectedCount = computed(() => {
  void props.editor.version;
  return props.editor.selectedNodes.length;
});
const isSelected = (id: string) => {
  void props.editor.version;
  return props.editor.isNodeSelected(id);
};
const mergeLabel = computed(() => selectedCount.value > 1 ? 'pages.skineditor.layers.mergeSelected' : active.value?.kind === 'group' ? 'pages.skineditor.layers.mergeGroup' : 'pages.skineditor.layers.mergeDown');

const renamingId = ref<string | null>(null);
const renameValue = ref('');
const renameInput = ref<HTMLInputElement[] | HTMLInputElement | null>(null);

const startRename = async (node: LayerNode) => {
  renamingId.value = node.id;
  renameValue.value = node.name;
  await nextTick();
  const input = Array.isArray(renameInput.value) ? renameInput.value[0] : renameInput.value;
  input?.focus();
  input?.select();
};

const commitRename = () => {
  if (renamingId.value && renameValue.value.trim()) {
    props.editor.setNodeProperty(renamingId.value, 'name', renameValue.value.trim());
  }
  renamingId.value = null;
};

const menu = ref<{ x: number, y: number, node: LayerNode } | null>(null);

const menuElement = ref<HTMLElement | null>(null);

const openMenu = async (event: MouseEvent, node: LayerNode) => {
  if (!props.editor.isNodeSelected(node.id)) props.editor.selectNode(node.id);
  else props.editor.activeLayerId = node.id;
  menu.value = {x: event.clientX, y: event.clientY, node};
  await nextTick();
  const element = menuElement.value;
  if (!element || !menu.value) return;
  const rect = element.getBoundingClientRect();
  menu.value = {
    ...menu.value,
    x: Math.max(4, Math.min(menu.value.x, window.innerWidth - rect.width - 4)),
    y: Math.max(4, Math.min(menu.value.y, window.innerHeight - rect.height - 4))
  };
};

const closeMenu = () => {
  menu.value = null;
};

const menuAction = (action: () => void) => {
  action();
  closeMenu();
};

const drag = ref<{ id: string, startY: number, active: boolean, keep: boolean } | null>(null);
const drop = ref<{ id: string, position: 'before' | 'after' | 'inside' } | null>(null);

const onRowPointerDown = (event: PointerEvent, node: LayerNode) => {
  if (event.button !== 0 || renamingId.value) return;
  if (event.ctrlKey || event.metaKey) {
    props.editor.toggleNodeSelection(node.id);
    return;
  }
  if (event.shiftKey) {
    props.editor.selectNodeRange(node.id, rows.value.map(row => row.node.id));
    return;
  }
  const keep = selectedCount.value > 1 && props.editor.isNodeSelected(node.id);
  if (!keep) props.editor.selectNode(node.id);
  drag.value = {id: node.id, startY: event.clientY, active: false, keep};
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd, {once: true});
};

const onDragMove = (event: PointerEvent) => {
  if (!drag.value) return;
  if (!drag.value.active && Math.abs(event.clientY - drag.value.startY) < 5) return;
  drag.value.active = true;
  const element = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-node-id]') as HTMLElement | null;
  if (!element) {
    drop.value = null;
    return;
  }
  const id = element.dataset.nodeId!;
  const rect = element.getBoundingClientRect();
  const ratio = (event.clientY - rect.top) / rect.height;
  const isGroup = element.dataset.group === 'true';
  const position = isGroup && ratio > 0.3 && ratio < 0.7 ? 'inside' : ratio < 0.5 ? 'before' : 'after';
  drop.value = id === drag.value.id ? null : {id, position};
};

const onDragEnd = () => {
  window.removeEventListener('pointermove', onDragMove);
  if (drag.value?.active && drop.value) props.editor.moveNode(drag.value.id, drop.value.id, drop.value.position);
  else if (drag.value?.keep) props.editor.selectNode(drag.value.id);
  drag.value = null;
  drop.value = null;
};

const onDocumentPointerDown = (event: PointerEvent) => {
  if (!(event.target as HTMLElement)?.closest('.skin-editor-menu')) {
    if (menu.value) closeMenu();
    targetMenu.value = null;
  }
};

onMounted(() => window.addEventListener('pointerdown', onDocumentPointerDown, true));
onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', onDocumentPointerDown, true);
  window.removeEventListener('pointermove', onDragMove);
});

const opacityPercent = computed(() => Math.round((active.value?.opacity ?? 1) * 100));

const setOpacity = (event: Event) => {
  if (!active.value) return;
  props.editor.setSelectedProperty('opacity', Number((event.target as HTMLInputElement).value) / 100, true);
};

const setBlend = (event: Event) => {
  if (!activeLayer.value) return;
  props.editor.setSelectedProperty('blend', (event.target as HTMLSelectElement).value);
};

const targetMenu = ref<{ x: number, y: number, id: string } | null>(null);

const targetMenuElement = ref<HTMLElement | null>(null);

const openTargetMenu = async (event: MouseEvent, node: LayerNode) => {
  const anchor = (event.currentTarget as HTMLElement).getBoundingClientRect();
  targetMenu.value = {x: anchor.left, y: anchor.bottom + 4, id: node.id};
  await nextTick();
  const rect = targetMenuElement.value?.getBoundingClientRect();
  if (!rect || !targetMenu.value) return;
  targetMenu.value = {
    ...targetMenu.value,
    x: Math.max(4, Math.min(anchor.left, window.innerWidth - rect.width - 4)),
    y: anchor.bottom + 4 + rect.height > window.innerHeight ? Math.max(4, anchor.top - rect.height - 4) : anchor.bottom + 4
  };
};

const chooseTarget = (target: LayerTarget) => {
  if (targetMenu.value) props.editor.setLayerTarget(targetMenu.value.id, target);
  targetMenu.value = null;
};

const legacyOverlay = (node: LayerNode) => node.kind === 'layer' && node.target === 'overlay' && !formatSupportsOverlay.value;
</script>

<template>
  <section class="skin-editor-panel flex flex-col min-h-0">
    <header class="skin-editor-panel-header">
      <span>{{ t('pages.skineditor.layers.title') }}</span>
      <div class="flex gap-0.5">
        <button class="skin-editor-icon-btn" :title="t('pages.skineditor.layers.add') + ' (Ctrl+Shift+N)'" @click="editor.addLayer()"><i class="icon-layers-plus"></i></button>
        <button class="skin-editor-icon-btn" :title="t('pages.skineditor.layers.addGroup') + ' (Ctrl+G)'" @click="editor.addGroup()"><i class="icon-folder-plus"></i></button>
        <button class="skin-editor-icon-btn" :disabled="!active" :title="t('pages.skineditor.layers.duplicate') + ' (Ctrl+J)'" @click="active && editor.duplicateNode(active.id)"><i class="icon-copy"></i></button>
        <button class="skin-editor-icon-btn" :disabled="!active" :title="t(mergeLabel) + ' (Ctrl+E)'" @click="active && editor.mergeDown(active.id)"><i class="icon-merge"></i></button>
        <button class="skin-editor-icon-btn hover-danger" :disabled="!active" :title="t('pages.skineditor.layers.delete')" @click="active && editor.deleteNode(active.id)"><i class="icon-trash-2"></i></button>
      </div>
    </header>

    <div v-if="active" class="skin-editor-layer-bar">
      <select class="skin-editor-input" :disabled="!activeLayer" :value="activeLayer?.blend ?? 'normal'" :title="t('pages.skineditor.layers.blend')" @change="setBlend">
        <option v-for="mode in BLEND_MODES" :key="mode" :value="mode" class="bg-black text-white">{{ t('pages.skineditor.layers.blendModes.' + mode) }}</option>
      </select>
      <label class="skin-editor-layer-opacity" :title="t('pages.skineditor.layers.opacity')">
        <input type="range" min="0" max="100" :value="opacityPercent" class="skin-editor-range" @input="setOpacity">
        <span>{{ opacityPercent }}%</span>
      </label>
      <button class="skin-editor-icon-btn" :class="{'active': activeLayer?.clip}" :disabled="!activeLayer" :title="t('pages.skineditor.layers.clip') + ' (Ctrl+Alt+G): ' + t('pages.skineditor.layers.clipHint')" @click="editor.toggleClip()"><i class="icon-corner-down-right"></i></button>
    </div>
    <div v-if="selectedCount > 1" class="skin-editor-layer-multi">{{ t('pages.skineditor.layers.selectedCount', {count: selectedCount}) }}</div>

    <div class="skin-editor-layer-list flex flex-col overflow-y-auto">
      <div v-for="row in rows" :key="row.node.id"
           class="skin-editor-layer-row"
           :class="{
             'active': editor.activeLayerId === row.node.id,
             'selected': selectedCount > 1 && isSelected(row.node.id),
             'dimmed': !row.node.visible || row.hiddenByParent,
             'drop-before': drop?.id === row.node.id && drop.position === 'before',
             'drop-after': drop?.id === row.node.id && drop.position === 'after',
             'drop-inside': drop?.id === row.node.id && drop.position === 'inside',
             'dragging': drag?.active && drag.id === row.node.id
           }"
           :data-node-id="row.node.id"
           :data-group="row.node.kind === 'group'"
           :style="{paddingLeft: (0.25 + row.depth * 0.9) + 'rem'}"
           @pointerdown="onRowPointerDown($event, row.node)"
           @contextmenu.prevent="openMenu($event, row.node)">
        <button class="skin-editor-icon-btn small" @pointerdown.stop :title="t('pages.skineditor.layers.visibility')" @click="editor.setNodeProperty(row.node.id, 'visible', !row.node.visible)">
          <i :class="row.node.visible ? 'icon-eye' : 'icon-eye-off'"></i>
        </button>

        <button v-if="row.node.kind === 'group'" class="skin-editor-icon-btn small" @pointerdown.stop @click="editor.setNodeProperty(row.node.id, 'collapsed', !row.node.collapsed)">
          <i :class="row.node.collapsed ? 'icon-folder' : 'icon-folder-open'"></i>
        </button>
        <i v-else-if="row.node.clip" class="icon-corner-down-right skin-editor-clip-mark" :title="t('pages.skineditor.layers.clip')"></i>
        <SkinEditorLayerThumb v-if="row.node.kind === 'layer'" :layer="row.node" :layout="editor.layout" :version="editor.version"/>

        <input v-if="renamingId === row.node.id" ref="renameInput" v-model="renameValue" class="skin-editor-input grow min-w-0 text-sm" @pointerdown.stop @keydown.enter="commitRename" @keydown.escape="renamingId = null" @blur="commitRename">
        <span v-else class="grow min-w-0 truncate text-sm" @dblclick="startRename(row.node)">{{ row.node.name }}</span>

        <button v-if="row.node.kind === 'layer'" class="skin-editor-target-badge" :class="[row.node.target, {'warning': legacyOverlay(row.node)}]" :title="t('pages.skineditor.layers.renderTarget') + ': ' + t('pages.skineditor.layers.target.' + row.node.target) + (legacyOverlay(row.node) ? ' · ' + t('pages.skineditor.layers.legacyOverlay') : '')" @pointerdown.stop @click="openTargetMenu($event, row.node)">
          {{ targetShort(row.node) }}
        </button>
        <button class="skin-editor-icon-btn small" :class="{'muted': !row.node.locked}" @pointerdown.stop :title="t('pages.skineditor.layers.lock')" @click="editor.setNodeProperty(row.node.id, 'locked', !row.node.locked)">
          <i :class="row.node.locked ? 'icon-lock' : 'icon-lock-open'"></i>
        </button>
      </div>
      <div v-if="!rows.length" class="p-3 text-sm opacity-60 text-center">{{ t('pages.skineditor.layers.empty') }}</div>
    </div>

    <Teleport to="body">
      <div v-if="targetMenu" ref="targetMenuElement" class="skin-editor-menu" :style="{left: targetMenu.x + 'px', top: targetMenu.y + 'px'}">
        <span class="skin-editor-menu-label">{{ t('pages.skineditor.layers.renderTarget') }}</span>
        <button v-for="target in targets" :key="target.id" :class="{'checked': editor.doc.findLayer(targetMenu.id)?.target === target.id}" :title="t('pages.skineditor.layers.target.' + target.id + 'Hint')" @click="chooseTarget(target.id)">
          <span class="skin-editor-target-badge" :class="target.id">{{ target.short }}</span>{{ t('pages.skineditor.layers.target.' + target.id) }}
        </button>
      </div>
      <div v-if="menu" ref="menuElement" class="skin-editor-menu" :style="{left: menu.x + 'px', top: menu.y + 'px'}">
        <span v-if="selectedCount > 1" class="skin-editor-menu-label">{{ t('pages.skineditor.layers.selectedCount', {count: selectedCount}) }}</span>
        <button v-if="selectedCount < 2" @click="menuAction(() => startRename(menu!.node))"><i class="icon-pencil"></i>{{ t('pages.skineditor.layers.rename') }}</button>
        <button @click="menuAction(() => editor.duplicateNode(menu!.node.id))"><i class="icon-copy"></i>{{ t('pages.skineditor.layers.duplicate') }}<kbd>Ctrl+J</kbd></button>
        <button @click="menuAction(() => editor.mergeDown(menu!.node.id))"><i class="icon-merge"></i>{{ t(mergeLabel) }}<kbd>Ctrl+E</kbd></button>
        <button @click="menuAction(() => editor.clearLayer(menu!.node.id))"><i class="icon-eraser"></i>{{ t('pages.skineditor.layers.clear') }}</button>
        <template v-if="menu.node.kind === 'layer' && selectedCount < 2">
          <button @click="menuAction(() => editor.toggleClip(menu!.node.id))"><i class="icon-corner-down-right"></i>{{ t(menu.node.clip ? 'pages.skineditor.layers.unclip' : 'pages.skineditor.layers.makeClip') }}<kbd>Ctrl+Alt+G</kbd></button>
          <button v-if="menu.node.target === 'atlas'" @click="menuAction(() => editor.splitAtlasLayer(menu!.node.id))"><i class="icon-layers-2"></i>{{ t('pages.skineditor.layers.split') }}</button>
        </template>
        <button @click="menuAction(() => editor.mergeVisible())"><i class="icon-layers"></i>{{ t('pages.skineditor.layers.mergeVisible') }}<kbd>Ctrl+Shift+E</kbd></button>
        <hr>
        <button @click="menuAction(() => editor.groupActive())"><i class="icon-folder-plus"></i>{{ t('pages.skineditor.layers.group') }}<kbd>Ctrl+G</kbd></button>
        <button v-if="menu.node.kind === 'group'" @click="menuAction(() => editor.ungroupActive())"><i class="icon-folder-open"></i>{{ t('pages.skineditor.layers.ungroup') }}<kbd>Ctrl+Shift+G</kbd></button>
        <button @click="menuAction(() => editor.moveNodeStep(menu!.node.id, -1))"><i class="icon-arrow-up"></i>{{ t('pages.skineditor.layers.moveUp') }}<kbd>Ctrl+]</kbd></button>
        <button @click="menuAction(() => editor.moveNodeStep(menu!.node.id, 1))"><i class="icon-arrow-down"></i>{{ t('pages.skineditor.layers.moveDown') }}<kbd>Ctrl+[</kbd></button>
        <hr>
        <button class="danger" @click="menuAction(() => editor.deleteNode(menu!.node.id))"><i class="icon-trash-2"></i>{{ t('pages.skineditor.layers.delete') }}</button>
      </div>
    </Teleport>
  </section>
</template>
