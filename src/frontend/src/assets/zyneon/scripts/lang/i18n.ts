import { createI18n } from 'vue-i18n'
import de from '../../locales/de.json'
import en from '../../locales/en.json'

type MessageSchema = typeof en
const savedLocale = localStorage.getItem('user-lang') || navigator.language.split('-')[0]

export const i18n = createI18n<[MessageSchema], 'en' | 'de'>({
    legacy: false,
    locale: ['en', 'de'].includes(savedLocale) ? savedLocale : 'en',
    fallbackLocale: 'en',
    messages: {
        en,
        de
    }
})