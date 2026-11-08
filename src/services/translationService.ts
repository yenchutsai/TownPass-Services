/**
 * Client-side Translation Service powered by LibreTranslate
 * Endpoint: http://ws6.csie.ntu.edu.tw:12345/translate
 *
 * Provides translation for newly retrieved events with localStorage caching.
 */

import type { BolaEvent, EventTranslation } from '@/interfaces/event.interface';

const LIBRE_TRANSLATE_URL = 'http://ws6.csie.ntu.edu.tw:12345/translate';
const LOCAL_STORAGE_CACHE_KEY = 'townpass_event_translations_cache_v1';

export type SupportedTargetLang = 'en' | 'th' | 'vi' | 'id';

interface TranslationCacheStore {
  [lang: string]: {
    [sourceText: string]: string;
  };
}

let memoryCache: TranslationCacheStore | null = null;

function getCache(): TranslationCacheStore {
  if (memoryCache) return memoryCache;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    if (raw) {
      memoryCache = JSON.parse(raw);
      return memoryCache!;
    }
  } catch {
    // Ignore localStorage parse errors
  }
  memoryCache = { en: {}, th: {}, vi: {}, id: {} };
  return memoryCache;
}

function saveCache(): void {
  if (!memoryCache) return;
  try {
    localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(memoryCache));
  } catch {
    // LocalStorage quota exceeded or unavailable
  }
}

/**
 * Translates an array of texts into a target language using LibreTranslate.
 * Checks local cache first; only fetches missing texts from server.
 */
export async function translateTexts(
  texts: string[],
  targetLang: SupportedTargetLang,
  sourceLang = 'zh-Hant'
): Promise<Record<string, string>> {
  const cache = getCache();
  if (!cache[targetLang]) {
    cache[targetLang] = {};
  }

  const result: Record<string, string> = {};
  const missing: string[] = [];

  for (const text of texts) {
    if (!text) continue;
    if (cache[targetLang][text]) {
      result[text] = cache[targetLang][text];
    } else {
      missing.push(text);
    }
  }

  if (missing.length === 0) {
    return result;
  }

  try {
    const response = await fetch(LIBRE_TRANSLATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: missing,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      })
    });

    if (response.ok) {
      const data = await response.json();
      const translatedList: string[] = Array.isArray(data.translatedText)
        ? data.translatedText
        : [data.translatedText];

      missing.forEach((origText, idx) => {
        const trans = translatedList[idx] || origText;
        cache[targetLang][origText] = trans;
        result[origText] = trans;
      });

      saveCache();
    } else {
      // Fallback to original text on HTTP error
      for (const m of missing) {
        result[m] = m;
      }
    }
  } catch {
    // Fallback on network or CORS failure
    for (const m of missing) {
      result[m] = m;
    }
  }

  return result;
}

/**
 * Enriches newly fetched events with translations for a target language if not already present.
 */
export async function enrichEventWithTranslation(
  event: BolaEvent,
  targetLang: SupportedTargetLang
): Promise<BolaEvent> {
  if (event.translations?.[targetLang]?.title) {
    return event;
  }

  const textsToTranslate: string[] = [];
  if (event.title) textsToTranslate.push(event.title);
  if (event.summary) {
    const shortSummary = event.summary.length > 300 ? event.summary.slice(0, 300) : event.summary;
    textsToTranslate.push(shortSummary);
  }
  if (event.source) textsToTranslate.push(event.source);

  const translations = await translateTexts(textsToTranslate, targetLang);

  const shortSummary =
    event.summary && event.summary.length > 300 ? event.summary.slice(0, 300) : event.summary;

  const translationEntry: EventTranslation = {
    title: translations[event.title] || event.titleEn || event.title,
    summary:
      translations[shortSummary] || translations[event.summary] || event.summaryEn || event.summary,
    source: translations[event.source || ''] || event.sourceEn || event.source
  };

  if (!event.translations) {
    event.translations = {};
  }
  event.translations[targetLang] = translationEntry;

  return event;
}
