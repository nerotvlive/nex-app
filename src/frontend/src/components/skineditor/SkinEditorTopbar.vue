<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import type {SkinEditor, ViewMode} from "../../assets/zyneon/scripts/skineditor";
import {hasNativeFileAccess, openSkinFolder} from "../../assets/zyneon/scripts/skineditor";

const props = defineProps<{ editor: SkinEditor }>();
const emit = defineEmits<{
  (event: 'new'): void,
  (event: 'open'): void,
  (event: 'convert'): void,
  (event: 'help'): void
}>();
const {t} = useI18n();

const fileMenu = ref(false);
const nativeFiles = hasNativeFileAccess();

const views: { id: ViewMode, icon: string }[] = [
  {id: '3d', icon: 'icon-rotate-3d'},
  {id: 'split', icon: 'icon-columns-2'},
  {id: '2d', icon: 'icon-grid-3x3'}
];

const documentName = ref(props.editor.doc.name);
watch(() => props.editor.version, () => {
  documentName.value = props.editor.doc.name;
});

const commitName = () => {
  if (documentName.value.trim()) props.editor.rename(documentName.value);
  else documentName.value = props.editor.doc.name;
};

const formatLabel = computed(() => {
  void props.editor.version;
  return props.editor.doc.format === 'legacy' ? '64×32' : '64×64';
});

const model = computed(() => {
  void props.editor.version;
  return props.editor.doc.model;
});

const undoTitle = computed(() => {
  void props.editor.historyVersion;
  const label = props.editor.history.undoLabel;
  return t('pages.skineditor.menu.undo') + (label ? ': ' + t(label) : '') + ' (Ctrl+Z)';
});

const redoTitle = computed(() => {
  void props.editor.historyVersion;
  const label = props.editor.history.redoLabel;
  return t('pages.skineditor.menu.redo') + (label ? ': ' + t(label) : '') + ' (Ctrl+Shift+Z)';
});

const run = (action: () => void) => {
  fileMenu.value = false;
  action();
};

const closeMenu = (event: PointerEvent) => {
  if (fileMenu.value && !(event.target as HTMLElement)?.closest('.skin-editor-file-menu')) fileMenu.value = false;
};

onMounted(() => window.addEventListener('pointerdown', closeMenu, true));
onBeforeUnmount(() => window.removeEventListener('pointerdown', closeMenu, true));
</script>

<template>
  <div class="skin-editor-topbar flex items-center gap-2 px-2 py-1.5">
    <div class="skin-editor-file-menu relative">
      <button class="zyn-btn compact darker" :class="{'active-alt': fileMenu}" @click="fileMenu = !fileMenu">
        <i class="icon-folder"></i>
        <span>{{ t('pages.skineditor.menu.file') }}</span>
        <i class="icon-chevron-down text-xs"></i>
      </button>
      <div v-if="fileMenu" class="skin-editor-menu absolute left-0 top-full mt-1">
        <button @click="run(() => emit('new'))"><i class="icon-file-plus"></i>{{ t('pages.skineditor.menu.new') }}<kbd>Ctrl+N</kbd></button>
        <button @click="run(() => emit('open'))"><i class="icon-folder-open"></i>{{ t('pages.skineditor.menu.open') }}<kbd>Ctrl+O</kbd></button>
        <hr>
        <button @click="run(() => editor.save(false))"><i class="icon-save"></i>{{ t('pages.skineditor.menu.save') }}<kbd>Ctrl+S</kbd></button>
        <button @click="run(() => editor.save(true))"><i class="icon-save"></i>{{ t('pages.skineditor.menu.saveAs') }}<kbd>Ctrl+Shift+S</kbd></button>
        <button @click="run(() => editor.exportPng())"><i class="icon-file-image"></i>{{ t('pages.skineditor.menu.export') }}<kbd>Ctrl+Shift+Alt+W</kbd></button>
        <template v-if="nativeFiles">
          <hr>
          <button @click="run(openSkinFolder)"><i class="icon-folder"></i>{{ t('pages.skineditor.menu.openFolder') }}</button>
        </template>
      </div>
    </div>

    <input v-model="documentName" class="skin-editor-input skin-editor-doc-name" spellcheck="false" :title="t('pages.skineditor.document.name')" @keydown.enter="($event.target as HTMLInputElement).blur()" @blur="commitName">
    <span v-if="editor.dirty" class="skin-editor-dirty" :title="t('pages.skineditor.document.unsaved')">●</span>

    <div class="flex gap-0.5 ml-1">
      <button class="skin-editor-icon-btn" :disabled="!editor.canUndo" :title="undoTitle" @click="editor.undo()"><i class="icon-undo-2"></i></button>
      <button class="skin-editor-icon-btn" :disabled="!editor.canRedo" :title="redoTitle" @click="editor.redo()"><i class="icon-redo-2"></i></button>
    </div>

    <div class="grow"></div>

    <div class="skin-editor-segmented" :title="t('pages.skineditor.view.modeHint')">
      <button v-for="view in views" :key="view.id" :class="{'active': editor.viewMode === view.id}" @click="editor.viewMode = view.id">
        <i :class="view.icon"></i>
        <span class="hidden xl:inline">{{ t('pages.skineditor.view.' + view.id) }}</span>
      </button>
    </div>

    <div class="skin-editor-segmented" :title="t('pages.skineditor.model.hint')">
      <button :class="{'active': model === 'classic'}" @click="editor.setModel('classic')">{{ t('pages.skineditor.model.classic') }}</button>
      <button :class="{'active': model === 'slim'}" @click="editor.setModel('slim')">{{ t('pages.skineditor.model.slim') }}</button>
    </div>

    <button class="zyn-btn compact darker" :title="t('pages.skineditor.convert.open')" @click="emit('convert')">
      <i class="icon-refresh-cw"></i>
      <span>{{ formatLabel }}</span>
    </button>

    <div class="flex gap-0.5">
      <button class="skin-editor-icon-btn" :class="{'active': editor.shading}" :title="t('pages.skineditor.view.shading')" @click="editor.shading = !editor.shading"><i class="icon-sun-moon"></i></button>
      <button class="skin-editor-icon-btn" :class="{'active': editor.grid}" :title="t('pages.skineditor.view.grid')" @click="editor.grid = !editor.grid"><i class="icon-grid-3x3"></i></button>
      <button class="skin-editor-icon-btn" :class="{'active': editor.guides}" :title="t('pages.skineditor.view.guides')" @click="editor.guides = !editor.guides"><i class="icon-box"></i></button>
      <button class="skin-editor-icon-btn" :title="t('pages.skineditor.help.title')" @click="emit('help')"><i class="icon-info"></i></button>
    </div>
  </div>
</template>
