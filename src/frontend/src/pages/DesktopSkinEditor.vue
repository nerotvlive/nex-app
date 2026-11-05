<script setup lang="ts">
import '../assets/zyneon/css/skineditor.css';
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {ZyneonSettings} from "../assets/zyneon/scripts";
import {colorAt, createSkinEditor} from "../assets/zyneon/scripts/skineditor";
import {loadDraft} from "../assets/zyneon/scripts/skineditor/draft.ts";
import {PART_IDS} from "../assets/zyneon/scripts/skineditor";
import {alphaOf, toCss, toHex} from "../assets/zyneon/scripts/skineditor";
import SkinEditorTopbar from "../components/skineditor/SkinEditorTopbar.vue";
import SkinEditorTabs from "../components/skineditor/SkinEditorTabs.vue";
import SkinEditorToolOptions from "../components/skineditor/SkinEditorToolOptions.vue";
import SkinEditorToolbar from "../components/skineditor/SkinEditorToolbar.vue";
import SkinEditorViewport3D from "../components/skineditor/SkinEditorViewport3D.vue";
import SkinEditorViewport2D from "../components/skineditor/SkinEditorViewport2D.vue";
import SkinEditorParts from "../components/skineditor/SkinEditorParts.vue";
import SkinEditorColors from "../components/skineditor/SkinEditorColors.vue";
import SkinEditorLayers from "../components/skineditor/SkinEditorLayers.vue";
import SkinEditorConvertDialog from "../components/skineditor/SkinEditorConvertDialog.vue";

const {t} = useI18n();

const editor = createSkinEditor();
editor.translate = (key, params) => t(key, params ?? {});
editor.newDocument();

const showConvert = ref(false);
const showHelp = ref(false);
const draftInfo = ref<{ count: number, names: string, savedAt: number } | null>(null);
const confirmState = ref<{ message: string, confirm: string, resolve: (value: boolean) => void } | null>(null);
const dropZone = ref<'layer' | 'tab' | null>(null);

const askConfirm = (message: string, confirm: string) => new Promise<boolean>(resolve => {
  confirmState.value = {message, confirm, resolve};
});

const answerConfirm = (value: boolean) => {
  confirmState.value?.resolve(value);
  confirmState.value = null;
};

const onNew = () => editor.newDocument(editor.doc.format, editor.doc.model);

const onOpen = () => editor.open();

const closeTab = async (id: string) => {
  if (editor.isTabDirty(id)) {
    const ok = await askConfirm(t('pages.skineditor.dialog.closeTab', {name: editor.tabName(id)}), t('pages.skineditor.dialog.closeConfirm'));
    if (!ok) return;
  }
  editor.closeTab(id);
};

const restoreDraft = async () => {
  draftInfo.value = null;
  if (await editor.restoreDraft()) editor.notify('pages.skineditor.messages.draftRestored', 'success');
};

const discardDraft = () => {
  draftInfo.value = null;
  editor.discardDraft();
};

const zoneOf = (event: DragEvent): 'layer' | 'tab' => {
  const target = event.target as HTMLElement | null;
  if (target?.closest('.skin-editor-tabs')) return 'tab';
  if (target?.closest('.skin-editor-views')) return 'layer';
  return 'tab';
};

const onDragOver = (event: DragEvent) => {
  if (!event.dataTransfer?.types.includes('Files')) return;
  event.preventDefault();
  dropZone.value = zoneOf(event);
};

const onDragLeave = (event: DragEvent) => {
  if (!(event.relatedTarget as HTMLElement | null)?.closest?.('.skin-editor')) dropZone.value = null;
};

const onDrop = async (event: DragEvent) => {
  const zone = zoneOf(event);
  dropZone.value = null;
  const files = Array.from(event.dataTransfer?.files ?? []);
  if (!files.length) return;
  event.preventDefault();
  for (const file of files) {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (zone === 'layer') await editor.importAsLayers(file.name, bytes);
      else await editor.openBytes(file.name, null, bytes);
    } catch (error) {
      editor.notify('pages.skineditor.messages.openFailed', 'error', {error: String((error as Error)?.message ?? error)});
    }
  }
};

const isTyping = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null;
  return !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
};

const onKeyDown = (event: KeyboardEvent) => {
  if (confirmState.value) {
    if (event.key === 'Escape') answerConfirm(false);
    if (event.key === 'Enter') answerConfirm(true);
    return;
  }
  if (isTyping(event)) return;
  if (event.key === ' ') {
    editor.navigationHeld = true;
    event.preventDefault();
    return;
  }
  const ctrl = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();
  if (ctrl && !event.shiftKey && !event.altKey && key === 'n') {
    event.preventDefault();
    onNew();
    return;
  }
  if (ctrl && key === 'w') {
    event.preventDefault();
    void closeTab(editor.activeTabId);
    return;
  }
  if (ctrl && key === 'tab') {
    event.preventDefault();
    editor.cycleTab(event.shiftKey ? -1 : 1);
    return;
  }
  if (event.key === 'F1' || (event.key === '?' && !ctrl)) {
    event.preventDefault();
    showHelp.value = !showHelp.value;
    return;
  }
  if (editor.handleKey(event)) event.preventDefault();
};

const onKeyUp = (event: KeyboardEvent) => {
  if (event.key === ' ') editor.navigationHeld = false;
};

const onBlur = () => {
  editor.navigationHeld = false;
};

const hoverInfo = computed(() => {
  void editor.version;
  const hover = editor.hover;
  if (!hover) return null;
  const layout = editor.layout;
  const index = hover.y * layout.width + hover.x;
  if (index < 0 || index >= layout.width * layout.height) return null;
  const partIndex = layout.pixelPart[index] ?? -1;
  const part = hover.part ?? (partIndex >= 0 ? PART_IDS[partIndex] : undefined);
  const kind = layout.pixelKind[index] === 2 ? 'overlay' : layout.pixelKind[index] === 1 ? 'base' : null;
  const color = colorAt(editor, hover.x, hover.y);
  return {x: hover.x, y: hover.y, part, kind, color};
});

const activeLayerInfo = computed(() => {
  void editor.version;
  const layer = editor.activeLayer;
  return layer ? {name: layer.name, target: layer.target, opacity: Math.round(layer.opacity * 100)} : null;
});

const messageText = computed(() => editor.message ? t(editor.message.key, editor.message.params ?? {}) : '');

const shortcuts: { title: string, keys: [string, string][] }[] = [
  {
    title: 'pages.skineditor.help.groups.tools', keys: [
      ['B / Shift+B', 'pages.skineditor.help.keys.brush'],
      ['E', 'pages.skineditor.tools.eraser.name'],
      ['G', 'pages.skineditor.tools.fill.name'],
      ['I / Alt', 'pages.skineditor.tools.picker.name'],
      ['O', 'pages.skineditor.tools.shade.name'],
      ['M', 'pages.skineditor.tools.select.name'],
      ['V', 'pages.skineditor.tools.move.name'],
      ['U / Shift+U', 'pages.skineditor.help.keys.shapes'],
      ['H / Space', 'pages.skineditor.help.keys.navigate'],
      ['[ / ]', 'pages.skineditor.help.keys.size'],
      ['X / D', 'pages.skineditor.help.keys.colors'],
      ['Alt+S', 'pages.skineditor.help.keys.mirror']
    ]
  },
  {
    title: 'pages.skineditor.help.groups.layers', keys: [
      ['Ctrl+Shift+N', 'pages.skineditor.layers.add'],
      ['Ctrl+J / Ctrl+Shift+J', 'pages.skineditor.help.keys.layerVia'],
      ['Ctrl+E / Ctrl+Shift+E', 'pages.skineditor.help.keys.merge'],
      ['Ctrl+G / Ctrl+Shift+G', 'pages.skineditor.help.keys.group'],
      ['Ctrl+[ / Ctrl+]', 'pages.skineditor.help.keys.order'],
      ['Alt+[ / Alt+]', 'pages.skineditor.help.keys.selectLayer'],
      ['1 … 9 / 0', 'pages.skineditor.help.keys.opacity'],
      ['Alt+⌫ / Ctrl+⌫', 'pages.skineditor.help.keys.fill']
    ]
  },
  {
    title: 'pages.skineditor.help.groups.document', keys: [
      ['Ctrl+N / Ctrl+O', 'pages.skineditor.help.keys.newOpen'],
      ['Ctrl+S / Ctrl+Shift+S', 'pages.skineditor.help.keys.save'],
      ['Ctrl+Shift+Alt+W', 'pages.skineditor.menu.export'],
      ['Ctrl+W / Ctrl+Tab', 'pages.skineditor.help.keys.tabs'],
      ['Ctrl+Z / Ctrl+Shift+Z', 'pages.skineditor.help.keys.undo'],
      ['Ctrl+A / Ctrl+D', 'pages.skineditor.help.keys.select'],
      ['Ctrl+C / X / V', 'pages.skineditor.help.keys.clipboard']
    ]
  },
  {
    title: 'pages.skineditor.help.groups.view', keys: [
      ['Tab', 'pages.skineditor.help.keys.panels'],
      ['F', 'pages.skineditor.help.keys.view'],
      ['Ctrl++ / Ctrl+- / Ctrl+0', 'pages.skineditor.help.keys.zoom'],
      ["Ctrl+' / Ctrl+H", 'pages.skineditor.help.keys.grid'],
      ['Alt+1 … 6 / Alt+0', 'pages.skineditor.help.keys.parts']
    ]
  }
];

onMounted(async () => {
  ZyneonSettings.setMenuExpanded(localStorage.getItem("nexapp.neo.settings.view.menu") === "true");
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  const draft = await loadDraft();
  if (draft) draftInfo.value = {count: draft.tabs.length, names: draft.tabs.map(tab => tab.name).join(', '), savedAt: draft.savedAt};
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('blur', onBlur);
  editor.dispose();
});
</script>

<template>
  <div class="skin-editor flex flex-col w-full h-full overflow-hidden" :class="{'panels-hidden': editor.panelsHidden}" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
    <SkinEditorTopbar :editor="editor" @new="onNew" @open="onOpen" @convert="showConvert = true" @help="showHelp = true"/>
    <SkinEditorToolOptions v-show="!editor.panelsHidden" :editor="editor"/>

    <div v-if="draftInfo" class="skin-editor-banner flex items-center gap-3 px-3 py-1.5 text-sm">
      <i class="icon-info"></i>
      <span class="grow">{{ t('pages.skineditor.draft.found', {count: draftInfo.count, names: draftInfo.names, time: new Date(draftInfo.savedAt).toLocaleString()}) }}</span>
      <button class="zyn-btn compact accent" @click="restoreDraft">{{ t('pages.skineditor.draft.restore') }}</button>
      <button class="zyn-btn compact darker" @click="discardDraft">{{ t('pages.skineditor.draft.discard') }}</button>
    </div>

    <div class="flex flex-1 min-h-0">
      <SkinEditorToolbar v-show="!editor.panelsHidden" :editor="editor"/>

      <div class="flex flex-col flex-1 min-w-0">
        <SkinEditorTabs :editor="editor" :drop-active="dropZone === 'tab'" @close="closeTab" @new="onNew"/>
        <div class="skin-editor-views flex flex-1 min-h-0" :class="['mode-' + editor.viewMode, {'drop-target': dropZone === 'layer'}]">
          <div v-show="editor.viewMode !== '2d'" class="skin-editor-view flex-1 min-w-0">
            <SkinEditorViewport3D :editor="editor"/>
          </div>
          <div v-show="editor.viewMode !== '3d'" class="skin-editor-view flex-1 min-w-0">
            <SkinEditorViewport2D :editor="editor"/>
          </div>
          <div v-if="dropZone === 'layer'" class="skin-editor-drop">
            <i class="icon-layers-plus text-3xl"></i>
            <span>{{ t('pages.skineditor.document.dropLayer') }}</span>
          </div>
        </div>
      </div>

      <aside v-show="!editor.panelsHidden" class="skin-editor-sidebar flex flex-col gap-2 p-2 overflow-y-auto">
        <SkinEditorParts :editor="editor"/>
        <SkinEditorColors :editor="editor"/>
        <SkinEditorLayers :editor="editor" class="grow"/>
      </aside>
    </div>

    <footer class="skin-editor-status flex items-center gap-4 px-3 py-1 text-xs">
      <template v-if="hoverInfo">
        <span class="font-mono">{{ hoverInfo.x }}, {{ hoverInfo.y }}</span>
        <span v-if="hoverInfo.part">{{ t('pages.skineditor.parts.' + hoverInfo.part) }}<template v-if="hoverInfo.kind"> · {{ t('pages.skineditor.layers.target.' + hoverInfo.kind) }}</template></span>
        <span class="flex items-center gap-1">
          <span class="skin-editor-status-swatch checker"><span :style="{background: toCss(hoverInfo.color)}"></span></span>
          <span class="font-mono">{{ alphaOf(hoverInfo.color) ? toHex(hoverInfo.color) : '—' }}</span>
        </span>
      </template>
      <span v-else class="opacity-60">{{ t('pages.skineditor.status.hint') }}</span>
      <div class="grow"></div>
      <span v-if="activeLayerInfo" class="opacity-80">
        {{ activeLayerInfo.name }} → {{ t('pages.skineditor.layers.target.' + activeLayerInfo.target) }} · {{ activeLayerInfo.opacity }}%
      </span>
      <span v-if="editor.mirror" class="zyn-text-accent-alt">{{ t('pages.skineditor.tools.mirror') }}</span>
    </footer>

    <transition name="skin-editor-fade">
      <div v-if="editor.message" class="skin-editor-toast" :class="editor.message.kind">{{ messageText }}</div>
    </transition>

    <SkinEditorConvertDialog v-if="showConvert" :editor="editor" @close="showConvert = false"/>

    <div v-if="showHelp" class="skin-editor-modal-backdrop" @pointerdown.self="showHelp = false">
      <div class="skin-editor-modal wide">
        <header class="flex items-center gap-2">
          <i class="icon-info"></i>
          <strong class="text-white grow">{{ t('pages.skineditor.help.title') }}</strong>
          <button class="skin-editor-icon-btn" @click="showHelp = false"><i class="icon-x"></i></button>
        </header>
        <p class="text-sm opacity-80">{{ t('pages.skineditor.help.layers') }}</p>
        <p class="text-sm opacity-80">{{ t('pages.skineditor.help.mouse') }}</p>
        <div class="grid grid-cols-2 gap-x-6 gap-y-4">
          <div v-for="group in shortcuts" :key="group.title" class="flex flex-col gap-1">
            <span class="skin-editor-subtitle">{{ t(group.title) }}</span>
            <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <template v-for="[keys, label] in group.keys" :key="keys">
                <kbd class="self-start justify-self-start">{{ keys }}</kbd>
                <span class="leading-snug">{{ t(label) }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="confirmState" class="skin-editor-modal-backdrop">
      <div class="skin-editor-modal">
        <p class="text-sm">{{ confirmState.message }}</p>
        <footer class="flex justify-end gap-2">
          <button class="zyn-btn compact darker" @click="answerConfirm(false)">{{ t('pages.skineditor.dialog.cancel') }}</button>
          <button class="zyn-btn compact danger" @click="answerConfirm(true)">{{ confirmState.confirm }}</button>
        </footer>
      </div>
    </div>
  </div>
</template>
