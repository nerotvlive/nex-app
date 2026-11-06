<script setup lang="ts">
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import type {SkinEditor, ViewMode} from "../../assets/zyneon/scripts/skineditor";
import SkinEditorMenuBar from "./SkinEditorMenuBar.vue";
import {WindowControls, ZyneonSettings} from "../../assets/zyneon/scripts";

const props = defineProps<{ editor: SkinEditor }>();
const emit = defineEmits<{
  (event: 'new'): void,
  (event: 'open'): void,
  (event: 'help'): void
}>();
const {t} = useI18n();

const views: { id: ViewMode, icon: string }[] = [
  {id: '3d', icon: 'icon-rotate-3d'},
  {id: 'split', icon: 'icon-columns-2'},
  {id: '2d', icon: 'icon-grid-3x3'}
];

const model = computed(() => {
  void props.editor.version;
  return props.editor.doc.model;
});
</script>

<template>
  <div class="skin-editor-topbar flex items-center gap-2 px-2 py-1.5">
    <SkinEditorMenuBar @mousedown.stop :editor="editor" @new="emit('new')" @open="emit('open')" @help="emit('help')"/>

    <div class="grow"></div>

    <div class="skin-editor-segmented shrink-0" :title="t('pages.skineditor.view.modeHint')">
      <button @mousedown.stop v-for="view in views" :key="view.id" :class="{'active': editor.viewMode === view.id}" @click="editor.viewMode = view.id"><i :class="view.icon"></i><span class="hidden xl:inline">{{ t('pages.skineditor.view.' + view.id) }}</span></button>
    </div>

    <div class="skin-editor-segmented shrink-0" :title="t('pages.skineditor.model.hint')">
      <button @mousedown.stop :class="{'active': model === 'classic'}" @click="editor.setModel('classic')">{{ t('pages.skineditor.model.classic') }}</button>
      <button @mousedown.stop :class="{'active': model === 'slim'}" @click="editor.setModel('slim')">{{ t('pages.skineditor.model.slim') }}</button>
    </div>

    <div v-if="ZyneonSettings.isSecondaryFrame" class="flex" @mousedown.stop>
        <button class="w-8 h-8 flex justify-center items-center zyn-br-sm hover:bg-zinc-100/20" type="button" @click="WindowControls.minimize()" id="titlebar-button-minimize"><i class="icon-minus"></i></button>
        <button class="w-8 h-8 flex justify-center items-center zyn-br-sm hover:bg-zinc-100/20" type="button" @click="WindowControls.toggleMaximize()" id="titlebar-button-maximize"><i class="icon-square"></i></button>
        <button class="w-8 h-8 flex justify-center items-center zyn-br-sm hover:bg-red-600" type="button" @click="WindowControls.close()" id="titlebar-button-close"><i class="icon-x"></i></button>
    </div>
  </div>
</template>
