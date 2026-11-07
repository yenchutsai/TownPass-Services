import { watch } from 'vue';
import { createI18n } from 'vue-i18n';
import {
  defaultLocale,
  getInitialLocale,
  isAppLocale,
  languageOptions,
  localeStorageKey,
  type AppLocale
} from './config';

type MessageTree = { [key: string]: string | MessageTree };

const messages = Object.fromEntries(languageOptions.map(({ value }) => [value, {}])) as Record<
  AppLocale,
  MessageTree
>;

// Each feature owns its translation files. New keys do not require registry edits.
const modules = import.meta.glob<MessageTree>('./messages/*/*.json', {
  eager: true,
  import: 'default'
});

for (const [path, resource] of Object.entries(modules)) {
  const [, namespace, locale] = path.match(/^\.\/messages\/([^/]+)\/([^/]+)\.json$/) ?? [];
  if (namespace && isAppLocale(locale)) messages[locale][namespace] = resource;
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: defaultLocale,
  messages
});

export const currentLocale = i18n.global.locale;

export function setLocale(locale: string) {
  if (isAppLocale(locale)) currentLocale.value = locale;
}

watch(
  currentLocale,
  (locale) => {
    if (typeof document !== 'undefined') document.documentElement.lang = locale;
    try {
      localStorage.setItem(localeStorageKey, locale);
      localStorage.removeItem('townpass_events_lang');
    } catch {
      // Language changes still work without persistent storage.
    }
  },
  { immediate: true, flush: 'sync' }
);

export default i18n;
