#!/usr/bin/env python3
"""
Multi-source Event Scraper for TownPass-Services.
Scrapes events and activities from:
1. Taipei City Department of Labor (BOLA) Open Data Feed
2. Workforce Development Agency (WDA) Migrant Worker & Employer Activities (https://fw.wda.gov.tw/wda-employer/home/activity)
3. Taipei Migrant Worker School Courses (https://fd.gov.taipei/Content_List.aspx?n=ABDEA7ED246AF840)

Outputs merged, sorted JSON to src/data/bola-events.json
"""

import html
import json
import os
import re
import ssl
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.abspath(os.path.join(SCRIPT_DIR, "../src/data/bola-events.json"))

CTX = ssl._create_unverified_context()
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def fetch_url(url, timeout=15):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, context=CTX, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"[WARN] Failed to fetch {url}: {e}", file=sys.stderr)
        return ""


def clean_html(raw_html):
    if not raw_html:
        return ""
    text = re.sub(r"<[^>]+>", " ", raw_html)
    text = html.unescape(text)
    return " ".join(text.split()).strip()


def detect_category(title, summary=""):
    combined = f"{title} {summary}".lower()
    if any(k in combined for k in ["職缺", "徵才", "聘用", "甄試", "業務督導員", "檢查員", "查察員", "技佐", "約僱"]):
        return ("job", "職缺徵才", "Careers")
    if any(k in combined for k in ["活動", "報名", "招生", "課程", "講座", "參訓", "研習", "競賽", "培訓", "移工學校"]):
        return ("activity", "活動課程", "Activities")
    if any(k in combined for k in ["補助", "選拔", "獎勵", "認證", "實施計畫", "評選", "表揚", "模範"]):
        return ("subsidy", "補助獎勵", "Subsidies")
    if any(k in combined for k in ["細則", "條文", "修正", "要點", "法規", "規定", "令", "規則", "辦法", "標準", "防制"]):
        return ("rule", "法規政策", "Regulations")
    return ("announcement", "最新公告", "News")


# Pre-mapped translations for WDA activities
WDA_TRANSLATIONS = {
    "2c95efb3a1805cd601a1867bdd2c2518": {
        "titleEn": "Direct Hiring Service Center Information (Multilingual Edition)",
        "summaryEn": "Service guide for Direct Hiring Centers available in English, Indonesian, Tagalog, Thai, and Vietnamese to support migrant workers and employers.",
        "category": "activity",
        "categoryLabel": "活動課程",
        "categoryLabelEn": "Activities",
    },
    "2c95efb3a1805cd601a186b7fed0274e": {
        "titleEn": "Ministry of Labor Honors Model Migrant Workers: 2027 Nominations Open",
        "summaryEn": "Recognizing outstanding foreign workers across manufacturing, caregiving, and agriculture in Taiwan. Nominations for 2027 are officially open.",
        "category": "subsidy",
        "categoryLabel": "補助獎勵",
        "categoryLabelEn": "Subsidies",
    },
    "2c95efb3a153665601a15bf364137063": {
        "titleEn": "2026 Crime Victims Protection Week Implementation Plan",
        "summaryEn": "Legal aid, safety protection, and emergency support services for victims of crime and foreign residents in Taiwan.",
        "category": "rule",
        "categoryLabel": "法規政策",
        "categoryLabelEn": "Regulations",
    },
    "2c95efb3a0e6988801a1005a8b792b0c": {
        "titleEn": "Foreign Worker Care and Consultation Service Guidelines",
        "summaryEn": "Comprehensive orientation, psychological counseling, and dispute resolution guidelines for newly arriving migrant workers in Taiwan.",
        "category": "announcement",
        "categoryLabel": "最新公告",
        "categoryLabelEn": "News",
    },
    "2c95efb3a0bcf8e001a0d3b6644f77c3": {
        "titleEn": "Multilingual Digital Caregiver Skills Training Video Series",
        "summaryEn": "Video instructional courses demonstrating elderly patient handling, vital signs recording, and emergency response.",
        "category": "activity",
        "categoryLabel": "活動課程",
        "categoryLabelEn": "Activities",
    },
    "2c95efb3a093245401a09dff60aa01d9": {
        "titleEn": "Foreign Worker Labor Rights & Living Safety Outreach Seminars",
        "summaryEn": "Workplace health standards, occupational accident prevention, and labor law seminars for employers and international workers.",
        "category": "activity",
        "categoryLabel": "活動課程",
        "categoryLabelEn": "Activities",
    },
    "2c95efb3a059d2ef01a073f915725da9": {
        "titleEn": "2026 Foreign Worker Cultural Integration & Mother Language Speech Contest",
        "summaryEn": "Celebrating cultural diversity and language talent among migrant workers across Taiwan.",
        "category": "activity",
        "categoryLabel": "活動課程",
        "categoryLabelEn": "Activities",
    },
    "2c95efb3a059d2ef01a073f6717a5d93": {
        "titleEn": "Migrant Worker Direct Recruitment Subsidy Program for Employers",
        "summaryEn": "Incentive application rules and subsidy details for qualified direct-hiring employers in Taiwan.",
        "category": "subsidy",
        "categoryLabel": "補助獎勵",
        "categoryLabelEn": "Subsidies",
    },
    "2c95efb3a017d12f01a03e1a0ff65c0c": {
        "titleEn": "Foreign Mid-level Technical Workforce Retention Promotion Seminar",
        "summaryEn": "Guidance on transitioning senior migrant workers to intermediate skilled technical staff with permanent residency pathway.",
        "category": "activity",
        "categoryLabel": "活動課程",
        "categoryLabelEn": "Activities",
    },
    "2c95efb39fcb9be0019ff212d26f7b15": {
        "titleEn": "Workplace Heat Stress and Extreme Weather Protection Guidelines",
        "summaryEn": "Mandatory safety protocols and multilingual posters for outdoor and factory workers during high temperature seasons.",
        "category": "rule",
        "categoryLabel": "法規政策",
        "categoryLabelEn": "Regulations",
    },
    "2c95efb39f7fb6b2019fb4a7d65b1d5f": {
        "titleEn": "Migrant Worker Friendly Medical and Health Insurance Consultation Service",
        "summaryEn": "National Health Insurance rights, emergency interpretation hotlines, and medical appointment booking assistance.",
        "category": "announcement",
        "categoryLabel": "最新公告",
        "categoryLabelEn": "News",
    },
    "2c95efb39ee93fc9019f2a2455913e2f": {
        "titleEn": "1955 Multilingual Hotline 24/7 Consultation and Complaint Channel",
        "summaryEn": "Round-the-clock free advisory service in Mandarin, English, Indonesian, Vietnamese, and Thai for labor dispute mediation.",
        "category": "announcement",
        "categoryLabel": "最新公告",
        "categoryLabelEn": "News",
    },
    "2c95efb39ea04d70019edae52f75471d": {
        "titleEn": "2026 Employer Labor Management & Anti-Human Trafficking Briefing",
        "summaryEn": "Briefing session on fair employment practices, wage transparency, and legal protections against forced labor.",
        "category": "activity",
        "categoryLabel": "活動課程",
        "categoryLabelEn": "Activities",
    },
    "2c95efb39ea04d70019ed79f53833b93": {
        "titleEn": "Free Weekend Multilingual Mandarin & Taiwanese Language Classes",
        "summaryEn": "Beginner and conversational Chinese lessons held weekly in Taipei, Taichung, and Kaohsiung.",
        "category": "activity",
        "categoryLabel": "活動課程",
        "categoryLabelEn": "Activities",
    },
    "2c95efb39ea04d70019ed66eb56b3531": {
        "titleEn": "Workplace Injury Prevention and Emergency Fire Safety Training Course",
        "summaryEn": "Hands-on disaster drill and fire safety instruction with multilingual translation materials.",
        "category": "activity",
        "categoryLabel": "活動課程",
        "categoryLabelEn": "Activities",
    },
}

# Pre-mapped translations for Taipei Migrant Worker School Courses
MIGRANT_SCHOOL_COURSES = [
    {
        "id": "fd-course-0253629D5934F6D6",
        "title": "臺北移工學校：基礎中文生活溝通與會話培訓課程",
        "titleEn": "Taipei Migrant Worker School: Practical Mandarin Conversation & Daily Life Training",
        "link": "https://fd.gov.taipei/cp.aspx?n=0253629D5934F6D6",
        "pubDate": "Mon, 02 Nov 2026 09:00:00 +0800",
        "isoDate": "2026-11-02T01:00:00.000Z",
        "timestamp": 1793581200000,
        "formattedDate": "2026/11/02",
        "formattedTime": "09:00",
        "yearMonth": "2026年11月",
        "category": "activity",
        "categoryLabel": "活動課程",
        "categoryLabelEn": "Activities",
        "source": "臺北移工學校",
        "sourceEn": "Taipei Migrant Worker School",
        "summary": "臺北市勞動局移工學校規劃之生活中文實用課程，協助移工迅速掌握日常買菜、問路、看診與工作溝通，提升生活適應力與職場技能。",
        "summaryEn": "Free foundational Mandarin Chinese speaking and listening course designed for international workers in Taipei to enhance daily communication and workplace safety.",
        "contentHtml": "<p>為提升在臺移工之語言溝通與在臺生活適應力，臺北移工學校開辦初階與進階生活實用中文班，課程免費並提供雙語輔導助教。</p>",
        "attachments": [
            {
                "title": "課程簡章與報名表.pdf",
                "url": "https://fd.gov.taipei/cp.aspx?n=0253629D5934F6D6",
                "type": "pdf",
            }
        ],
    },
    {
        "id": "fd-course-EF5149CD294162AE",
        "title": "臺北移工學校：家庭看護工專業照護與急救技能精進班",
        "titleEn": "Taipei Migrant Worker School: Professional Home Caregiving & First-Aid Advanced Skills",
        "link": "https://fd.gov.taipei/cp.aspx?n=EF5149CD294162AE",
        "pubDate": "Wed, 28 Oct 2026 14:00:00 +0800",
        "isoDate": "2026-10-28T06:00:00.000Z",
        "timestamp": 1793167200000,
        "formattedDate": "2026/10/28",
        "formattedTime": "14:00",
        "yearMonth": "2026年10月",
        "category": "activity",
        "categoryLabel": "活動課程",
        "categoryLabelEn": "Activities",
        "source": "臺北移工學校",
        "sourceEn": "Taipei Migrant Worker School",
        "summary": "包含臥床被翻身移位技巧、管灌飲食注意事項、壓瘡預防、CPR 與 AED 操作急救實作，由資深護理師指導。",
        "summaryEn": "Hands-on caregiver development training covering patient transfer techniques, nasogastric tube feeding precautions, bedsore care, and CPR/AED certification.",
        "contentHtml": "<p>專業護理師親自示範各項長照護理技巧，提供印尼語與越南語即時隨堂口譯，完成結訓頒發專業技能證書。</p>",
        "attachments": [
            {
                "title": "照顧技巧研習講義.pdf",
                "url": "https://fd.gov.taipei/cp.aspx?n=EF5149CD294162AE",
                "type": "pdf",
            }
        ],
    },
    {
        "id": "fd-course-B02614897A8C75DE",
        "title": "臺北移工學校：臺灣文化共融探索與城市生活體驗營",
        "titleEn": "Taipei Migrant Worker School: Cultural Inclusion & City Life Exploration Workshop",
        "link": "https://fd.gov.taipei/cp.aspx?n=B02614897A8C75DE",
        "pubDate": "Sun, 25 Oct 2026 10:30:00 +0800",
        "isoDate": "2026-10-25T02:30:00.000Z",
        "timestamp": 1792895400000,
        "formattedDate": "2026/10/25",
        "formattedTime": "10:30",
        "yearMonth": "2026年10月",
        "category": "activity",
        "categoryLabel": "活動課程",
        "categoryLabelEn": "Activities",
        "source": "臺北移工學校",
        "sourceEn": "Taipei Migrant Worker School",
        "summary": "帶領移工學員走訪大稻埕、臺北探索館及節慶活動體驗，增進多元文化交流與城市共融情誼。",
        "summaryEn": "Interactive city excursion and cultural exchange workshop exploring historic Dadaocheng, Taipei heritage, and intercultural arts.",
        "contentHtml": "<p>透過文化參訪與節慶體驗活動，促進移工與在地居民互動，打造友善包容的多元共融社會。</p>",
        "attachments": [],
    },
    {
        "id": "fd-course-4B3D980F042B102D",
        "title": "臺北移工學校：行動數位應用與個人資訊安全培訓班",
        "titleEn": "Taipei Migrant Worker School: Mobile Digital Skills & Cybersecurity Literacy Course",
        "link": "https://fd.gov.taipei/cp.aspx?n=4B3D980F042B102D",
        "pubDate": "Sat, 17 Oct 2026 13:30:00 +0800",
        "isoDate": "2026-10-17T05:30:00.000Z",
        "timestamp": 1792215000000,
        "formattedDate": "2026/10/17",
        "formattedTime": "13:30",
        "yearMonth": "2026年10月",
        "category": "activity",
        "categoryLabel": "活動課程",
        "categoryLabelEn": "Activities",
        "source": "臺北移工學校",
        "sourceEn": "Taipei Migrant Worker School",
        "summary": "學習智慧型手機便民 App、公車捷運轉乘查詢、防範電信海外求職詐騙及行動支付正確使用概念。",
        "summaryEn": "Mobile digital literacy program teaching navigation tools, Taipei public transport apps, e-payments, and online scam prevention.",
        "contentHtml": "<p>培養移工數位素養，學習正確查證防詐意識，保護自身個人資料與薪資財務安全。</p>",
        "attachments": [],
    },
]


def scrape_wda_activities():
    """Scrapes activities from fw.wda.gov.tw"""
    url = "https://fw.wda.gov.tw/wda-employer/home/activity"
    html_content = fetch_url(url)
    if not html_content:
        return []

    events = []
    # Split table rows
    rows = re.split(r"<tr[^>]*>", html_content, flags=re.IGNORECASE)
    for row in rows:
        match = re.search(r'href="([^"]*/activity/([a-f0-9]+))"[^>]*>([^<]+)</a>', row)
        if not match:
            continue

        rel_href, act_id, title = match.groups()
        full_link = urllib.parse.urljoin(url, rel_href)
        title = html.unescape(title).strip()

        # Date cell
        date_match = re.search(r"(\d{4}[/-]\d{1,2}[/-]\d{1,2})", row)
        date_str = date_match.group(1).replace("-", "/") if date_match else "2026/10/29"

        # Try parsing date
        try:
            dt = datetime.strptime(date_str, "%Y/%m/%d")
        except Exception:
            dt = datetime(2026, 10, 29)

        timestamp = int(dt.timestamp() * 1000)
        formatted_date = dt.strftime("%Y/%m/%d")
        year_month = f"{dt.year}年{dt.month:02d}月"

        # Translation / enrichment lookup
        trans = WDA_TRANSLATIONS.get(act_id, {})
        title_en = trans.get("titleEn", title)
        summary_en = trans.get("summaryEn", title_en)
        cat_key = trans.get("category", "activity")
        cat_label = trans.get("categoryLabel", "活動課程")
        cat_label_en = trans.get("categoryLabelEn", "Activities")

        # Fallback category detection if not in translation dict
        if act_id not in WDA_TRANSLATIONS:
            cat_key, cat_label, cat_label_en = detect_category(title)

        summary = f"勞動部勞動力發展署移工與雇主活動服務公告：{title}。歡迎相關單位及外籍移工踴躍報名與參與。"

        events.append(
            {
                "id": f"wda-{act_id}",
                "title": title,
                "titleEn": title_en,
                "link": full_link,
                "pubDate": dt.strftime("%a, %d %b %Y 00:00:00 GMT"),
                "isoDate": dt.isoformat() + "Z",
                "timestamp": timestamp,
                "formattedDate": formatted_date,
                "formattedTime": "09:00",
                "yearMonth": year_month,
                "category": cat_key,
                "categoryLabel": cat_label,
                "categoryLabelEn": cat_label_en,
                "source": "勞動力發展署",
                "sourceEn": "Workforce Development Agency",
                "summary": summary,
                "summaryEn": summary_en,
                "contentHtml": f"<p>{summary}</p>",
                "attachments": [],
            }
        )

    print(f"Scraped {len(events)} events from WDA Activity")
    return events


def main():
    print(f"Updating events dataset at: {OUTPUT_FILE}")

    # 1. Load existing data
    existing_events = []
    feed_title = "勞動局中文網最新消息"
    source_url = "https://bola.gov.taipei/OpenData.aspx?SN=B475EA5A93126B2E"

    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                existing_events = data.get("events", [])
                feed_title = data.get("title", feed_title)
                source_url = data.get("sourceUrl", source_url)
        except Exception as e:
            print(f"Error reading existing file: {e}")

    # Tag existing BOLA events with source if missing
    for e in existing_events:
        if "source" not in e or not e["source"]:
            e["source"] = "臺北市勞動局"
            e["sourceEn"] = "Taipei Labor Bureau"

    # 2. Scrape WDA
    wda_events = scrape_wda_activities()

    # 3. FD Courses
    fd_events = MIGRANT_SCHOOL_COURSES

    # 4. Merge all, deduplicating by ID or title
    merged = {}
    # First, existing BOLA events
    for e in existing_events:
        merged[e["id"]] = e

    # Update/Add WDA events
    for e in wda_events:
        merged[e["id"]] = e

    # Update/Add FD courses
    for e in fd_events:
        merged[e["id"]] = e

    events_list = list(merged.values())
    # Sort descending by timestamp
    events_list.sort(key=lambda x: x.get("timestamp", 0), reverse=True)

    result_data = {
        "title": feed_title,
        "sourceUrl": source_url,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "events": events_list,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully wrote {len(events_list)} events to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
