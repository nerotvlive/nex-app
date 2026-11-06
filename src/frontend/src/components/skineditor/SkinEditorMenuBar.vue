<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import type {AdjustmentKind, AdjustScope, SkinEditor} from "../../assets/zyneon/scripts/skineditor";
import {hasNativeFileAccess, hasParameters, openSkinFolder} from "../../assets/zyneon/scripts/skineditor";

const props = defineProps<{ editor: SkinEditor }>();
const emit = defineEmits<{
  (event: 'new'): void,
  (event: 'open'): void,
  (event: 'help'): void
}>();
const {t} = useI18n();

interface MenuItem {
  label: string;
  icon: string;
  kbd?: string;
  action: () => void;
  disabled?: boolean;
  checked?: boolean;
}

type MenuEntry = MenuItem | 'separator' | { header: string };

const openMenu = ref<string | null>(null);
const nativeFiles = hasNativeFileAccess();

const adjust = (kind: AdjustmentKind, scope: AdjustScope) => {
  if (hasParameters(kind)) props.editor.openAdjustment(kind, scope);
  else props.editor.applyAdjustmentNow({kind}, scope);
};

const adjustments = (scope: AdjustScope): MenuEntry[] => [
  {label: 'pages.skineditor.adjust.brightnessContrast', icon: 'icon-sun-medium', action: () => adjust('brightnessContrast', scope)},
  {label: 'pages.skineditor.adjust.hueSaturation', icon: 'icon-droplets', kbd: scope === 'layer' ? 'Ctrl+U' : undefined, action: () => adjust('hueSaturation', scope)},
  {label: 'pages.skineditor.adjust.invert', icon: 'icon-contrast', kbd: scope === 'layer' ? 'Ctrl+I' : undefined, action: () => adjust('invert', scope)},
  {label: 'pages.skineditor.adjust.desaturate', icon: 'icon-droplet', kbd: scope === 'layer' ? 'Ctrl+Shift+U' : undefined, action: () => adjust('desaturate', scope)},
  {label: 'pages.skineditor.adjust.posterize', icon: 'icon-layers', action: () => adjust('posterize', scope)}
];

const selectRegion = (mode: 'face' | 'part') => {
  props.editor.wandMode = mode;
  props.editor.setTool('wand');
  props.editor.notify('pages.skineditor.messages.clickRegion');
};

const menus = computed<{ id: string, entries: MenuEntry[] }[]>(() => {
  void props.editor.version;
  void props.editor.historyVersion;
  const editor = props.editor;
  const doc = editor.doc;
  const layer = editor.activeLayer;
  const node = editor.activeNode;
  const hasSelection = !!editor.selection || !!editor.selectionMask;
  const otherModel = doc.model === 'classic' ? 'slim' : 'classic';
  return [
    {
      id: 'file', entries: [
        {label: 'pages.skineditor.menu.new', icon: 'icon-file-plus', kbd: 'Ctrl+N', action: () => emit('new')},
        {label: 'pages.skineditor.menu.open', icon: 'icon-folder-open', kbd: 'Ctrl+O', action: () => emit('open')},
        'separator',
        {label: 'pages.skineditor.menu.save', icon: 'icon-save', kbd: 'Ctrl+S', action: () => editor.save(false)},
        {label: 'pages.skineditor.menu.saveAs', icon: 'icon-save', kbd: 'Ctrl+Shift+S', action: () => editor.save(true)},
        'separator',
        {label: 'pages.skineditor.menu.export', icon: 'icon-file-image', kbd: 'Ctrl+Shift+Alt+W', action: () => editor.exportPng()},
        {label: 'pages.skineditor.menu.exportLegacy', icon: 'icon-file-down', disabled: doc.format === 'legacy', action: () => editor.exportPng('legacy', doc.model)},
        {label: 'pages.skineditor.menu.exportModel.' + otherModel, icon: 'icon-file-down', action: () => editor.exportPng(doc.format, otherModel)},
        ...(nativeFiles ? ['separator', {label: 'pages.skineditor.menu.openFolder', icon: 'icon-folder', action: openSkinFolder}] as MenuEntry[] : [])
      ]
    },
    {
      id: 'edit', entries: [
        {label: 'pages.skineditor.menu.undo', icon: 'icon-undo-2', kbd: 'Ctrl+Z', disabled: !editor.canUndo, action: () => editor.undo()},
        {label: 'pages.skineditor.menu.redo', icon: 'icon-redo-2', kbd: 'Ctrl+Shift+Z', disabled: !editor.canRedo, action: () => editor.redo()},
        'separator',
        {label: 'pages.skineditor.options.selection.cut', icon: 'icon-scissors', kbd: 'Ctrl+X', action: () => editor.copySelection(true)},
        {label: 'pages.skineditor.options.selection.copy', icon: 'icon-copy', kbd: 'Ctrl+C', action: () => editor.copySelection(false)},
        {label: 'pages.skineditor.options.selection.paste', icon: 'icon-clipboard-paste', kbd: 'Ctrl+V', action: () => editor.paste()},
        {label: 'pages.skineditor.options.selection.delete', icon: 'icon-trash-2', kbd: 'Del', action: () => editor.deleteSelection()},
        'separator',
        {label: 'pages.skineditor.menu.fillPrimary', icon: 'icon-paint-bucket', kbd: 'Alt+⌫', action: () => editor.fillSelection(editor.primaryColor)},
        {label: 'pages.skineditor.menu.fillSecondary', icon: 'icon-paint-bucket', kbd: 'Ctrl+⌫', action: () => editor.fillSelection(editor.secondaryColor)},
        'separator',
        {label: 'pages.skineditor.options.selection.flipH', icon: 'icon-flip-horizontal-2', action: () => editor.flipSelection('horizontal')},
        {label: 'pages.skineditor.options.selection.flipV', icon: 'icon-flip-vertical-2', action: () => editor.flipSelection('vertical')},
        {label: 'pages.skineditor.tools.mirrorSide', icon: 'icon-flip-horizontal', action: () => editor.mirrorToOtherSide()}
      ]
    },
    {
      id: 'image', entries: [
        {header: 'pages.skineditor.menu.adjustments'},
        ...adjustments('image'),
        'separator',
        {label: 'pages.skineditor.menu.flipImage', icon: 'icon-flip-horizontal', action: () => editor.flipImage()},
        {label: 'pages.skineditor.convert.open', icon: 'icon-refresh-cw', action: () => editor.openDialog({kind: 'convert'})},
        'separator',
        {label: 'pages.skineditor.view.problems', icon: 'icon-triangle-alert', checked: editor.showProblems, action: () => editor.showProblems = !editor.showProblems}
      ]
    },
    {
      id: 'layer', entries: [
        {label: 'pages.skineditor.layers.add', icon: 'icon-layers-plus', kbd: 'Ctrl+Shift+N', action: () => editor.addLayer()},
        {label: 'pages.skineditor.layers.group', icon: 'icon-folder-plus', kbd: 'Ctrl+G', disabled: !node, action: () => editor.groupActive()},
        {label: 'pages.skineditor.layers.duplicate', icon: 'icon-copy', disabled: !node, action: () => node && editor.duplicateNode(node.id)},
        {label: 'pages.skineditor.layers.delete', icon: 'icon-trash-2', disabled: !node, action: () => node && editor.deleteNode(node.id)},
        'separator',
        {label: 'pages.skineditor.layers.clip', icon: 'icon-corner-down-right', kbd: 'Ctrl+Alt+G', disabled: !layer, checked: !!layer?.clip, action: () => editor.toggleClip()},
        {label: node?.kind === 'group' ? 'pages.skineditor.layers.mergeGroup' : 'pages.skineditor.layers.mergeDown', icon: 'icon-merge', kbd: 'Ctrl+E', disabled: !node, action: () => node && editor.mergeDown(node.id)},
        {label: 'pages.skineditor.layers.mergeVisible', icon: 'icon-layers', kbd: 'Ctrl+Shift+E', action: () => editor.mergeVisible()},
        {label: 'pages.skineditor.layers.split', icon: 'icon-layers-2', disabled: layer?.target !== 'atlas', action: () => layer && editor.splitAtlasLayer(layer.id)},
        {label: 'pages.skineditor.layers.clear', icon: 'icon-eraser', disabled: !node, action: () => node && editor.clearLayer(node.id)},
        'separator',
        {header: 'pages.skineditor.menu.layerAdjustments'},
        ...adjustments('layer').map(entry => typeof entry === 'object' && 'action' in entry ? {...entry, disabled: !node} : entry),
        'separator',
        {label: 'pages.skineditor.layers.autoShade', icon: 'icon-sparkles', action: () => editor.openDialog({kind: 'autoShade'})}
      ]
    },
    {
      id: 'select', entries: [
        {label: 'pages.skineditor.menu.selectAll', icon: 'icon-square-dashed', kbd: 'Ctrl+A', action: () => editor.selectAll()},
        {label: 'pages.skineditor.options.selection.deselect', icon: 'icon-x', kbd: 'Ctrl+D', disabled: !hasSelection, action: () => editor.deselect()},
        {label: 'pages.skineditor.menu.invertSelection', icon: 'icon-contrast', kbd: 'Ctrl+Shift+I', action: () => editor.invertSelection()},
        'separator',
        {label: 'pages.skineditor.menu.selectFace', icon: 'icon-box', action: () => selectRegion('face')},
        {label: 'pages.skineditor.menu.selectPart', icon: 'icon-shirt', action: () => selectRegion('part')},
        {label: 'pages.skineditor.menu.colorRange', icon: 'icon-wand', action: () => editor.selectColorRange()}
      ]
    },
    {
      id: 'view', entries: [
        {label: 'pages.skineditor.view.3d', icon: 'icon-rotate-3d', checked: editor.viewMode === '3d', action: () => editor.viewMode = '3d'},
        {label: 'pages.skineditor.view.split', icon: 'icon-columns-2', checked: editor.viewMode === 'split', action: () => editor.viewMode = 'split'},
        {label: 'pages.skineditor.view.2d', icon: 'icon-grid-3x3', checked: editor.viewMode === '2d', action: () => editor.viewMode = '2d'},
        'separator',
        {label: 'pages.skineditor.view.grid', icon: 'icon-grid-3x3', kbd: "Ctrl+'", checked: editor.grid, action: () => editor.grid = !editor.grid},
        {label: 'pages.skineditor.view.guides', icon: 'icon-box', checked: editor.guides, action: () => editor.guides = !editor.guides},
        {label: 'pages.skineditor.view.shading', icon: 'icon-sun-moon', checked: editor.shading, action: () => editor.shading = !editor.shading},
        {label: 'pages.skineditor.view.problems', icon: 'icon-triangle-alert', checked: editor.showProblems, action: () => editor.showProblems = !editor.showProblems},
        {label: 'pages.skineditor.preview.voxel', icon: 'icon-boxes', checked: editor.voxelOverlay, action: () => editor.voxelOverlay = !editor.voxelOverlay},
        'separator',
        {label: 'pages.skineditor.help.keys.panels', icon: 'icon-panel-left', kbd: 'Tab', checked: !editor.panelsHidden, action: () => editor.panelsHidden = !editor.panelsHidden},
        {label: 'pages.skineditor.help.title', icon: 'icon-keyboard', kbd: 'F1', action: () => emit('help')}
      ]
    }
  ];
});

const toggle = (id: string) => {
  openMenu.value = openMenu.value === id ? null : id;
};

const hover = (id: string) => {
  if (openMenu.value) openMenu.value = id;
};

const run = (item: MenuItem) => {
  openMenu.value = null;
  item.action();
};

const close = (event: PointerEvent) => {
  if (openMenu.value && !(event.target as HTMLElement)?.closest('.skin-editor-menubar')) openMenu.value = null;
};

const onKey = (event: KeyboardEvent) => {
  if (openMenu.value && event.key === 'Escape') {
    openMenu.value = null;
    event.stopPropagation();
  }
};

onMounted(() => {
  window.addEventListener('pointerdown', close, true);
  window.addEventListener('keydown', onKey, true);
});

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', close, true);
  window.removeEventListener('keydown', onKey, true);
});
</script>

<template>
  <nav class="skin-editor-menubar">
    <div v-for="menu in menus" :key="menu.id" class="relative">
      <button :class="{'open': openMenu === menu.id}" @click="toggle(menu.id)" @pointerenter="hover(menu.id)">{{ t('pages.skineditor.menu.bar.' + menu.id) }}</button>
      <div v-if="openMenu === menu.id" class="skin-editor-menu">
        <template v-for="(entry, index) in menu.entries" :key="index">
          <hr v-if="entry === 'separator'">
          <span v-else-if="'header' in entry" class="skin-editor-menu-label">{{ t(entry.header) }}</span>
          <button v-else :class="{'checked': entry.checked}" :disabled="entry.disabled" @click="run(entry)">
            <i :class="entry.checked ? 'icon-check' : entry.icon"></i>{{ t(entry.label) }}<kbd v-if="entry.kbd">{{ entry.kbd }}</kbd>
          </button>
        </template>
      </div>
    </div>
  </nav>
</template>
