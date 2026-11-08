#!/usr/bin/env python3
"""
Translates events in src/data/bola-events.json into supported languages
(English, Thai, Vietnamese, Indonesian) using the LibreTranslate server
at ws6.csie.ntu.edu.tw:12345.

Translates titles, summaries, source agencies, detailed content HTML,
and attachment titles.

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


def translate_batch(texts, target_lang, source_lang="zh-Hant", batch_size=10, fmt="text"):
    """
    Translates a list of unique texts or HTML fragments in batches via LibreTranslate API.
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
                "format": fmt,
            }
        ).encode("utf-8")

        req = urllib.request.Request(
            TRANSLATE_URL,
            data=payload,
            headers={"Content-Type": "application/json"},
        )

        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                translated = data.get("translatedText", [])
                if isinstance(translated, list):
                    for orig, trans in zip(chunk, translated):
                        results[orig] = trans
                elif isinstance(translated, str) and len(chunk) == 1:
                    results[chunk[0]] = translated
        except Exception as e:
            print(
                f"[ERROR] Batch translation failed for {target_lang} (format={fmt}, chunk {i//batch_size + 1}): {e}",
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
                            "format": fmt,
                        }
                    ).encode("utf-8")
                    s_req = urllib.request.Request(
                        TRANSLATE_URL,
                        data=single_payload,
                        headers={"Content-Type": "application/json"},
                    )
                    with urllib.request.urlopen(s_req, timeout=15) as s_resp:
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

    # Seed known high-quality translations into the cache for English
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
        html_to_translate = set()

        for event in events:
            title = event.get("title", "").strip()
            summary = event.get("summary", "").strip()
            source = event.get("source", "").strip()
            content_html = event.get("contentHtml", "").strip()

            if title and title not in cache[lang]:
                texts_to_translate.add(title)
            if summary and summary not in cache[lang]:
                short_summary = summary[:300] if len(summary) > 300 else summary
                if short_summary not in cache[lang]:
                    texts_to_translate.add(short_summary)
            if source and source not in cache[lang]:
                texts_to_translate.add(source)

            # Translate attachment titles
            for att in event.get("attachments", []):
                att_title = att.get("title", "").strip()
                if att_title and att_title not in cache[lang]:
                    texts_to_translate.add(att_title)

            # Translate content HTML
            if content_html and content_html not in cache[lang]:
                html_to_translate.add(content_html)

        needed_texts = list(texts_to_translate)
        needed_html = list(html_to_translate)

        print(
            f"Found {len(needed_texts)} text strings and {len(needed_html)} HTML fragments needing translation for '{lang}'."
        )

        if needed_texts:
            t0 = time.time()
            trans_texts = translate_batch(needed_texts, target_lang=lang, fmt="text", batch_size=15)
            cache[lang].update(trans_texts)
            print(f"Translated {len(trans_texts)} texts in {time.time() - t0:.2f}s")
            save_cache(cache)

        if needed_html:
            t0 = time.time()
            # translate HTML in smaller batches of 8 for stability
            trans_html = translate_batch(needed_html, target_lang=lang, fmt="html", batch_size=8)
            cache[lang].update(trans_html)
            print(f"Translated {len(trans_html)} HTML fragments in {time.time() - t0:.2f}s")
            save_cache(cache)

        if not needed_texts and not needed_html:
            print(f"All texts and HTML for '{lang}' already cached!")

    # Enrich events with full translations dictionary
    for event in events:
        if "translations" not in event or not isinstance(event["translations"], dict):
            event["translations"] = {}

        title = event.get("title", "").strip()
        summary = event.get("summary", "").strip()
        short_summary = summary[:300] if len(summary) > 300 else summary
        source = event.get("source", "").strip()
        content_html = event.get("contentHtml", "").strip()

        for lang in SUPPORTED_LANGUAGES:
            trans_title = cache[lang].get(title, title)
            trans_summary = cache[lang].get(short_summary, cache[lang].get(summary, summary))
            trans_source = cache[lang].get(source, source)
            trans_content_html = cache[lang].get(content_html, content_html)

            # Translated attachments
            trans_attachments = []
            for att in event.get("attachments", []):
                att_title = att.get("title", "").strip()
                trans_att_title = cache[lang].get(att_title, att_title)
                trans_attachments.append(
                    {
                        "title": trans_att_title,
                        "url": att.get("url", ""),
                        "type": att.get("type", "file"),
                    }
                )

            event["translations"][lang] = {
                "title": trans_title,
                "summary": trans_summary,
                "source": trans_source,
                "contentHtml": trans_content_html,
                "attachments": trans_attachments,
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
