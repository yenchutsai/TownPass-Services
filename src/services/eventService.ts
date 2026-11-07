import fallbackData from '@/data/bola-events.json';
import type {
  BolaEvent,
  BolaEventAttachment,
  BolaEventsFeedData,
  EventCategoryKey
} from '@/interfaces/event.interface';

const BOLA_RSS_URL = 'https://bola.gov.taipei/OpenData.aspx?SN=B475EA5A93126B2E';
const DEV_PROXY_URL = '/api/bola-events';

export function detectCategory(
  title: string,
  desc: string
): { key: EventCategoryKey; label: string } {
  const text = `${title} ${desc}`.toLowerCase();
  if (/職缺|徵才|聘用|甄試|業務督導員|檢查員|查察員|組員|技佐|約僱/.test(text)) {
    return { key: 'job', label: '職缺徵才' };
  }
  if (/活動|報名|招生|課程|講座|參訓|研習|競賽|培訓/.test(text)) {
    return { key: 'activity', label: '活動報名' };
  }
  if (/補助|選拔|獎勵|認證|實施計畫|評選|表揚/.test(text)) {
    return { key: 'subsidy', label: '補助獎勵' };
  }
  if (/細則|條文|修正|要點|法規|規定|令|規則|辦法|標準/.test(text)) {
    return { key: 'rule', label: '法規政策' };
  }
  return { key: 'announcement', label: '最新公告' };
}

export function parseRssXml(xmlText: string): BolaEventsFeedData {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  const channel = xmlDoc.querySelector('channel');

  const channelTitle = channel?.querySelector('title')?.textContent || '勞動局中文網最新消息';
  const itemNodes = xmlDoc.querySelectorAll('item');

  const events: BolaEvent[] = [];

  itemNodes.forEach((itemNode, idx) => {
    const title = itemNode.querySelector('title')?.textContent?.trim() || '';
    const link = itemNode.querySelector('link')?.textContent?.trim() || '';
    const pubDateStr = itemNode.querySelector('pubDate')?.textContent?.trim() || '';
    const desc = itemNode.querySelector('description')?.textContent?.trim() || '';

    // Parse date
    const dateObj = pubDateStr ? new Date(pubDateStr) : new Date();
    const isValidDate = !Number.isNaN(dateObj.getTime());
    const timestamp = isValidDate ? dateObj.getTime() : 0;
    const isoDate = isValidDate ? dateObj.toISOString() : '';

    const formattedDate = isValidDate
      ? `${dateObj.getFullYear()}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`
      : '';
    const formattedTime = isValidDate
      ? `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`
      : '';
    const yearMonth = isValidDate
      ? `${dateObj.getFullYear()}年${String(dateObj.getMonth() + 1).padStart(2, '0')}月`
      : '';

    // Extract attachments & links
    const attachments: BolaEventAttachment[] = [];
    const div = document.createElement('div');
    div.innerHTML = desc;
    const anchorElements = div.querySelectorAll('a');

    anchorElements.forEach((a) => {
      const href = a.getAttribute('href') || '';
      const text = a.textContent?.trim() || '';
      if (
        href.includes('Download.ashx') ||
        /\.(pdf|odt|doc|docx|xls|xlsx|csv|zip|rar)/i.test(href) ||
        /\.(pdf|odt|doc|docx|xls|xlsx|csv|zip|rar)/i.test(text)
      ) {
        let type = 'file';
        if (/\.pdf/i.test(text) || /\.pdf/i.test(href)) type = 'pdf';
        else if (/\.odt/i.test(text) || /\.odt/i.test(href)) type = 'odt';
        else if (/\.docx?/i.test(text) || /\.docx?/i.test(href)) type = 'doc';

        attachments.push({
          title: text || '附件下載',
          url: href,
          type
        });
      }
    });

    // Clean summary
    const summary = (div.textContent || '').replace(/\s+/g, ' ').trim();

    // Event ID from link
    const sParamMatch = link.match(/[?&]s=([A-Za-z0-9]+)/);
    const id = sParamMatch ? sParamMatch[1] : `event-${idx}`;

    const { key: catKey, label: catLabel } = detectCategory(title, summary);

    events.push({
      id,
      title,
      link,
      pubDate: pubDateStr,
      isoDate,
      timestamp,
      formattedDate,
      formattedTime,
      yearMonth,
      category: catKey,
      categoryLabel: catLabel,
      summary,
      contentHtml: desc,
      attachments
    });
  });

  // Sort by time descending by default
  events.sort((a, b) => b.timestamp - a.timestamp);

  return {
    title: channelTitle,
    sourceUrl: BOLA_RSS_URL,
    updatedAt: new Date().toISOString(),
    events
  };
}

export async function fetchBolaEvents(): Promise<{
  data: BolaEventsFeedData;
  isFallback: boolean;
}> {
  // Strategy:
  // 1. Try local dev proxy `/api/bola-events`
  // 2. Try direct URL if proxy 404s
  // 3. Fallback to bundled static snapshot if network/CORS error occurs

  const urlsToTry = [DEV_PROXY_URL, BOLA_RSS_URL];

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/rss+xml, application/xml, text/xml, */*' }
      });
      if (response.ok) {
        const text = await response.text();
        if (text && text.includes('<rss')) {
          const parsed = parseRssXml(text);
          return { data: parsed, isFallback: false };
        }
      }
    } catch {
      // Continue to next or fallback
    }
  }

  // Fallback to static snapshot data
  const fallback = fallbackData as unknown as BolaEventsFeedData;
  return {
    data: {
      ...fallback,
      events: [...fallback.events].sort((a, b) => b.timestamp - a.timestamp)
    },
    isFallback: true
  };
}
