<script setup lang="ts">
import {nextTick, ref} from "vue";
import {useI18n} from "vue-i18n";
import type {SkinEditor} from "../../assets/zyneon/scripts/skineditor";

const props = defineProps<{ editor: SkinEditor, dropActive: boolean }>();
const emit = defineEmits<{
  (event: 'close', id: string): void,
  (event: 'new'): void
}>();
const {t} = useI18n();

const renamingId = ref<string | null>(null);
const renameValue = ref('');
const renameInput = ref<HTMLInputElement[] | HTMLInputElement | null>(null);

const startRename = async (id: string) => {
  props.editor.switchTab(id);
  renamingId.value = id;
  renameValue.value = props.editor.doc.name;
  await nextTick();
  const input = Array.isArray(renameInput.value) ? renameInput.value[0] : renameInput.value;
  input?.focus();
  input?.select();
};

const commitRename = () => {
  if (renamingId.value && renamingId.value === props.editor.activeTabId && renameValue.value.trim()) props.editor.rename(renameValue.value.trim());
  renamingId.value = null;
};

const onAuxClick = (event: MouseEvent, id: string) => {
  if (event.button === 1) emit('close', id);
};
</script>

<template>
  <div class="skin-editor-tabs flex items-end gap-1 p-1 overflow-x-auto" :class="{'drop-target': dropActive}">
    <div v-for="tab in editor.tabList" :key="tab.id" class="zyn-btn darker-alt compact" :class="{'active-alt': tab.active}" :title="tab.name + (tab.dirty ? ' · ' + t('pages.skineditor.document.unsaved') : '')" @click="editor.switchTab(tab.id)" @auxclick="onAuxClick($event, tab.id)" @mousedown.middle.prevent>
      <i class="icon-shirt hidden text-xs opacity-60"></i>
      <input v-if="renamingId === tab.id" ref="renameInput" v-model="renameValue" class="skin-editor-input skin-editor-tab-rename" spellcheck="false" @click.stop @dblclick.stop @keydown.enter="commitRename" @keydown.escape="renamingId = null" @blur="commitRename">
      <span v-else class="truncate" :title="t('pages.skineditor.tabs.renameHint')" @dblclick.stop="startRename(tab.id)">{{ tab.name }}</span>
      <span v-if="tab.dirty" class="skin-editor-dirty" :title="t('pages.skineditor.document.unsaved')"></span>
      <button class="skin-editor-tab-close" :title="t('pages.skineditor.tabs.close') + ' (Ctrl+W)'" @click.stop="emit('close', tab.id)">
        <i class="icon-x"></i>
      </button>
    </div>
    <button class="skin-editor-icon-btn small mb-0.5" :title="t('pages.skineditor.tabs.new') + ' (Ctrl+N)'" @click="emit('new')">
      <i class="icon-plus"></i>
    </button>
    <div class="grow"></div>
    <span v-if="dropActive" class="skin-editor-tabs-drop-hint text-xs px-2 pb-1">{{ t('pages.skineditor.document.dropTab') }}</span>
  </div>
</template>
