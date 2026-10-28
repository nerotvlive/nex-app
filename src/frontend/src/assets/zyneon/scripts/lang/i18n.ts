import { createI18n } from 'vue-i18n'
import de from '../../locales/de.json'
import en from '../../locales/en.json'
import fr from '../../locales/fr.json'

type MessageSchema = typeof en
const savedLocale = localStorage.getItem('user-lang') || navigator.language.split('-')[0]

export const i18n = createI18n<[MessageSchema], 'en' | 'de' | 'fr'>({
    legacy: false,
    locale: ['en', 'de', "fr"].includes(savedLocale) ? savedLocale : 'en',
    fallbackLocale: 'en',
    messages: {
        en,
        de,
        fr
    }
})