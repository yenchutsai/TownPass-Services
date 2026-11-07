import locales from './locales.json';

export type AppLocale = keyof typeof locales;
export const languageOptions = Object.entries(locales).map(([value, label]) => ({
  value: value as AppLocale,
  label
}));
export const defaultLocale: AppLocale = 'zh-TW';
export const localeStorageKey = 'townpass_locale';

export function isAppLocale(value: unknown): value is AppLocale {
  return languageOptions.some((option) => option.value === value);
}

export function getInitialLocale(): AppLocale {
  try {
    const saved = localStorage.getItem(localeStorageKey);
    if (isAppLocale(saved)) return saved;
    // Preserve the preference saved by the former events-only language switcher.
    if (!saved && localStorage.getItem('townpass_events_lang') === 'en') return 'en';
  } catch {
    // The app remains usable when browser storage is unavailable.
  }
  return defaultLocale;
}
