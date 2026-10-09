<script setup lang="ts">
    import { ref, computed } from "vue"
    import { useI18n } from "vue-i18n"
    import {useLang} from "../../../assets/zyneon/scripts/lang";
    const { t } = useI18n()
    const { setLang } = useLang()
    const selectedLang = ref(localStorage.getItem('user-lang') || 'auto')
    const languages = computed(() => [
        { code: 'auto', label: t('languages.auto.name') },
        { code: 'de', label: t('languages.de.name') },
        { code: 'en', label: t('languages.en.name') }
    ])
    const handleChange = (event: Event) => {
        const target = event.target as HTMLSelectElement
        const val = target.value as 'de' | 'en' | 'auto'
        selectedLang.value = val
        setLang(val)
    }
</script>

<template>
    <select :value="selectedLang" @change="handleChange" class="bg-zinc-900 px-2 py-0.5 rounded">
        <option v-for="lang in languages" :key="lang.code" :value="lang.code">
            {{ lang.label }}
        </option>
    </select>
</template>