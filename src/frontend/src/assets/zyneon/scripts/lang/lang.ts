import { useI18n } from 'vue-i18n'
import {ZyneonSettings} from "../settings.ts";

export const useLang = () => {
    const { locale } = useI18n()

    const setLang = (lang: 'de' | 'en' | 'fr' | 'auto' | 'reset') => {
        if(lang === 'auto') {
            localStorage.removeItem('user-lang')
            const browserLang = navigator.language.split('-')[0]
            locale.value = ['en', 'de', "fr"].includes(browserLang) ? browserLang : 'en'
        } else if (lang === 'de' || lang === 'en' || lang === 'fr') {
            localStorage.setItem('user-lang', lang)
            locale.value = lang
        } else if(lang === 'reset') {
            localStorage.removeItem('user-lang')
            window.location.reload()
        }
        ZyneonSettings.reloadMain()
    }

    return {
        locale,
        setLang
    }
}