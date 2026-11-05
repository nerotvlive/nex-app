import {ref, watch, type Ref} from "vue";

export function usePanelState(panel: string): Ref<boolean> {
    const key = 'nexapp.skineditor.panel.' + panel;
    const collapsed = ref(localStorage.getItem(key) === 'true');
    watch(collapsed, value => localStorage.setItem(key, String(value)));
    return collapsed;
}
