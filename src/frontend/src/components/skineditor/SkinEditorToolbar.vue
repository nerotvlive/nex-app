<script setup lang="ts">
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {type SkinEditor, TOOLS, type ToolInfo, toolShortcut} from "../../assets/zyneon/scripts/skineditor";
import {toCss} from "../../assets/zyneon/scripts/skineditor";

const props = defineProps<{ editor: SkinEditor }>();
const {t} = useI18n();

const primaryTools = TOOLS.filter(tool => tool.primary);
const moreTools = TOOLS.filter(tool => !tool.primary);
const showMore = ref(localStorage.getItem('nexapp.skineditor.moreTools') !== 'false');

const toggleMore = () => {
  showMore.value = !showMore.value;
  localStorage.setItem('nexapp.skineditor.moreTools', String(showMore.value));
};

const title = (tool: ToolInfo) => `${t('pages.skineditor.tools.' + tool.id + '.name')} (${toolShortcut(tool)})\n${t('pages.skineditor.tools.' + tool.id + '.hint')}`;

const primaryCss = computed(() => toCss(props.editor.primaryColor));
const secondaryCss = computed(() => toCss(props.editor.secondaryColor));
</script>

<template>
  <div class="skin-editor-toolbar flex flex-col items-center gap-1 p-1.5 overflow-y-auto">
    <button v-for="tool in primaryTools" :key="tool.id" class="zyn-btn darker-alt compact" :class="{'active-alt': editor.tool === tool.id}" :title="title(tool)" @click="editor.setTool(tool.id)">
      <i :class="tool.icon"></i>
    </button>

    <button class="skin-editor-tool-more" :title="t('pages.skineditor.tools.more')" @click="toggleMore">
      <i :class="showMore ? 'icon-chevron-down' : 'icon-chevron-right'"></i>
    </button>

    <template v-if="showMore">
      <button v-for="tool in moreTools" :key="tool.id" class="zyn-btn darker compact" :class="{'active-alt': editor.tool === tool.id}" :title="title(tool)" @click="editor.setTool(tool.id)">
        <i :class="tool.icon"></i>
      </button>
    </template>

    <div class="grow"></div>

    <button class="zyn-btn darker-alt compact" :class="{'active-alt': editor.mirror}" :title="t('pages.skineditor.tools.mirror') + ' (Alt+S)'" @click="editor.mirror = !editor.mirror">
      <i class="icon-flip-vertical-2"></i>
    </button>

    <div class="skin-editor-colors-mini" :title="t('pages.skineditor.colors.swapHint')">
      <div class="secondary checker"><div :style="{background: secondaryCss}"></div></div>
      <div class="primary checker"><div :style="{background: primaryCss}"></div></div>
      <button class="swap" @click="editor.swapColors()"><i class="icon-arrow-left-right"></i></button>
    </div>
  </div>
</template>
