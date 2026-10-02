<script setup lang="ts">
import {ref} from 'vue';
import MonacoEditor from 'monaco-editor-vue3';

let jsonContent = ref('');

function formatJson(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return jsonString;
  }
}

async function loadContent(input: string) {
  try {
    let rawContent = '';
    if (input.startsWith('http://') || input.startsWith('https://')) {
      const response = await fetch(input);
      if (!response.ok) throw new Error('Could not load URL');
      rawContent = await response.text();
    } else {
      let cleanPath = decodeURIComponent(input);
      if(cleanPath.startsWith("\"")) {
        cleanPath = cleanPath.replaceAll("\"", "");
      }
      if (cleanPath.startsWith('file://')) {
        cleanPath = cleanPath.replace('file://', '');
      }
      //rawContent = await invoke<string>('read_local_file', {path: cleanPath});
    }
    jsonContent.value = formatJson(rawContent);
  } catch (error) {
    console.error("Couldn't load content, an error occurred:", error);
    jsonContent.value = `// Couldn't load content, an error occurred: \n// ${error}`;
  }
}

defineExpose({ loadContent });

const editorOptions = {
  automaticLayout: true,
  readOnly: true,
};
</script>

<template>
  <div class="h-full w-full overflow-hidden">
    <MonacoEditor
        v-model:value="jsonContent"
        language="json"
        theme="vs-dark"
        :options="editorOptions"
        class="h-full w-full"
    />
  </div>
</template>