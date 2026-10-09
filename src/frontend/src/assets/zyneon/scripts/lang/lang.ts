import { useI18n } from 'vue-i18n'

export const useLang = () => {
    const { locale } = useI18n()

    const setLang = (lang: 'de' | 'en' | 'auto' | 'reset') => {
        if(lang === 'auto') {
            localStorage.removeItem('user-lang')
            const browserLang = navigator.language.split('-')[0]
            locale.value = ['en', 'de'].includes(browserLang) ? browserLang : 'en'
        } else if (lang === 'de' || lang === 'en') {
            localStorage.setItem('user-lang', lang)
            locale.value = lang
        } else if(lang === 'reset') {
            localStorage.removeItem('user-lang')
            window.location.reload()
        }
    }

    return {
        locale,
        setLang
    }
}