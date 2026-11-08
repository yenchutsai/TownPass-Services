#!/usr/bin/env python3
"""
Translates events in src/data/bola-events.json into supported languages
(English, Thai, Vietnamese, Indonesian) using the LibreTranslate server
at ws6.csie.ntu.edu.tw:12345.

Caches all translation results in src/data/translation-cache.json to avoid
redundant API requests.
"""

import json
import os
import sys
import time
import urllib.parse
import urllib.request

TRANSLATE_URL = "http://ws6.csie.ntu.edu.tw:12345/translate"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.abspath(os.path.join(SCRIPT_DIR, "../src/data/bola-events.json"))
CACHE_FILE = os.path.abspath(os.path.join(SCRIPT_DIR, "../src/data/translation-cache.json"))

SUPPORTED_LANGUAGES = ["en", "th", "vi", "id"]


def load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[WARN] Error loading cache: {e}", file=sys.stderr)
    return {lang: {} for lang in SUPPORTED_LANGUAGES}


def save_cache(cache):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


def translate_batch(texts, target_lang, source_lang="zh-Hant", batch_size=15):
    """
    Translates a list of unique texts in batches via LibreTranslate API.
    Returns a dict mapping original text -> translated text.
    """
    results = {}
    if not texts:
        return results

    for i in range(0, len(texts), batch_size):
        chunk = texts[i : i + batch_size]
        payload = json.dumps(
            {
                "q": chunk,
                "source": source_lang,
                "target": target_lang,
                "format": "text",
            }
        ).encode("utf-8")

        req = urllib.request.Request(
            TRANSLATE_URL,
            data=payload,
            headers={"Content-Type": "application/json"},
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                translated = data.get("translatedText", [])
                if isinstance(translated, list):
                    for orig, trans in zip(chunk, translated):
                        results[orig] = trans
                elif isinstance(translated, str) and len(chunk) == 1:
                    results[chunk[0]] = translated
        except Exception as e:
            print(
                f"[ERROR] Batch translation failed for {target_lang} (chunk {i//batch_size + 1}): {e}",
                file=sys.stderr,
            )
            # fallback to individual translation if batch failed
            for text in chunk:
                try:
                    single_payload = json.dumps(
                        {
                            "q": text,
                            "source": source_lang,
                            "target": target_lang,
                            "format": "text",
                        }
                    ).encode("utf-8")
                    s_req = urllib.request.Request(
                        TRANSLATE_URL,
                        data=single_payload,
                        headers={"Content-Type": "application/json"},
                    )
                    with urllib.request.urlopen(s_req, timeout=10) as s_resp:
                        s_data = json.loads(s_resp.read().decode("utf-8"))
                        results[text] = s_data.get("translatedText", text)
                except Exception as s_err:
                    print(f"[ERROR] Single translation error: {s_err}", file=sys.stderr)
                    results[text] = text

    return results


def translate_events():
    print(f"Reading events from: {DATA_FILE}")
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        feed_data = json.load(f)

    events = feed_data.get("events", [])
    print(f"Total events to process: {len(events)}")

    cache = load_cache()
    # Ensure cache has keys for all target languages
    for lang in SUPPORTED_LANGUAGES:
        if lang not in cache:
            cache[lang] = {}

    # Seed known high-quality translations into the cache
    for event in events:
        if event.get("title") and event.get("titleEn"):
            if event["title"] not in cache["en"]:
                cache["en"][event["title"]] = event["titleEn"]
        if event.get("summary") and event.get("summaryEn"):
            if event["summary"] not in cache["en"]:
                cache["en"][event["summary"]] = event["summaryEn"]
        if event.get("source") and event.get("sourceEn"):
            if event["source"] not in cache["en"]:
                cache["en"][event["source"]] = event["sourceEn"]

    # Process each supported language
    for lang in SUPPORTED_LANGUAGES:
        print(f"\n--- Processing language: {lang} ---")
        texts_to_translate = set()

        for event in events:
            title = event.get("title", "").strip()
            summary = event.get("summary", "").strip()
            source = event.get("source", "").strip()

            if title and title not in cache[lang]:
                texts_to_translate.add(title)
            if summary and summary not in cache[lang]:
                # If summary is very long (>500 chars), take first sentence or first 300 chars for concise mobile display
                short_summary = summary[:300] if len(summary) > 300 else summary
                if short_summary not in cache[lang]:
                    texts_to_translate.add(short_summary)
            if source and source not in cache[lang]:
                texts_to_translate.add(source)

        needed_list = list(texts_to_translate)
        print(f"Found {len(needed_list)} new texts needing translation into '{lang}'.")

        if needed_list:
            t0 = time.time()
            translated_dict = translate_batch(needed_list, target_lang=lang)
            cache[lang].update(translated_dict)
            print(f"Translated {len(translated_dict)} texts in {time.time() - t0:.2f}s")
            save_cache(cache)
        else:
            print("All texts already cached!")

    # Enrich events with full translations dictionary
    for event in events:
        if "translations" not in event or not isinstance(event["translations"], dict):
            event["translations"] = {}

        title = event.get("title", "").strip()
        summary = event.get("summary", "").strip()
        short_summary = summary[:300] if len(summary) > 300 else summary
        source = event.get("source", "").strip()

        for lang in SUPPORTED_LANGUAGES:
            trans_title = cache[lang].get(title, title)
            trans_summary = cache[lang].get(short_summary, cache[lang].get(summary, summary))
            trans_source = cache[lang].get(source, source)

            event["translations"][lang] = {
                "title": trans_title,
                "summary": trans_summary,
                "source": trans_source,
            }

            # Backwards compatibility for en
            if lang == "en":
                event["titleEn"] = trans_title
                event["summaryEn"] = trans_summary
                event["sourceEn"] = trans_source

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(feed_data, f, ensure_ascii=False, indent=2)

    save_cache(cache)
    print(f"\n[DONE] Successfully enriched and cached all events in {DATA_FILE}")


if __name__ == "__main__":
    translate_events()

