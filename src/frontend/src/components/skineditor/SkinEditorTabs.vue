<script setup lang="ts">
import {useI18n} from "vue-i18n";
import type {SkinEditor} from "../../assets/zyneon/scripts/skineditor";

defineProps<{ editor: SkinEditor, dropActive: boolean }>();
const emit = defineEmits<{
  (event: 'close', id: string): void,
  (event: 'new'): void
}>();
const {t} = useI18n();

const onAuxClick = (event: MouseEvent, id: string) => {
  if (event.button === 1) emit('close', id);
};
</script>

<template>
  <div class="skin-editor-tabs flex items-end gap-1 p-1 overflow-x-auto" :class="{'drop-target': dropActive}">
    <div v-for="tab in editor.tabList" :key="tab.id" class="zyn-btn darker-alt compact" :class="{'active-alt': tab.active}" :title="tab.name + (tab.dirty ? ' · ' + t('pages.skineditor.document.unsaved') : '')" @click="editor.switchTab(tab.id)" @auxclick="onAuxClick($event, tab.id)" @mousedown.middle.prevent>
      <i class="icon-shirt hidden text-xs opacity-60"></i>
      <span class="truncate">{{ tab.name }}</span>
      <span class="skin-editor-tab-format">{{ tab.format === 'legacy' ? '64×32' : '64×64' }}</span>
      <span v-if="tab.dirty" class="skin-editor-dirty">●</span>
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
