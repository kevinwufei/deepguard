import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import all language files
import en from './en';
import zh from './zh';
import hi from './hi';
import es from './es';
import fr from './fr';
import ar from './ar';
import ru from './ru';
import pt from './pt';
import pl from './pl';
import de from './de';
import ko from './ko';
import ja from './ja';
import tr from './tr';

export type Language = 'en' | 'zh' | 'hi' | 'es' | 'fr' | 'ar' | 'ru' | 'pt' | 'pl' | 'de' | 'ko' | 'ja' | 'tr';

export const LANGUAGES: { code: Language; label: string; nativeName: string; rtl?: boolean }[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'zh', label: 'Chinese', nativeName: '中文' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'es', label: 'Spanish', nativeName: 'Español' },
  { code: 'fr', label: 'French', nativeName: 'Français' },
  { code: 'ar', label: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'ru', label: 'Russian', nativeName: 'Русский' },
  { code: 'pt', label: 'Portuguese', nativeName: 'Português' },
  { code: 'pl', label: 'Polish', nativeName: 'Polski' },
  { code: 'de', label: 'German', nativeName: 'Deutsch' },
  { code: 'ko', label: 'Korean', nativeName: '한국어' },
  { code: 'ja', label: 'Japanese', nativeName: '日本語' },
  { code: 'tr', label: 'Turkish', nativeName: 'Türkçe' },
];

const resources = {
  en: { translation: en },
  zh: { translation: zh },
  hi: { translation: hi },
  es: { translation: es },
  fr: { translation: fr },
  ar: { translation: ar },
  ru: { translation: ru },
  pt: { translation: pt },
  pl: { translation: pl },
  de: { translation: de },
  ko: { translation: ko },
  ja: { translation: ja },
  tr: { translation: tr },
};

const savedLang = localStorage.getItem('deepguard_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
