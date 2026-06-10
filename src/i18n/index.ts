import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'

const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('language') || 'fr' : 'fr'

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: savedLanguage,
  fallbackLng: 'fr',
  interpolation: { escapeValue: false }
})

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lng)
  }
})

export default i18n
