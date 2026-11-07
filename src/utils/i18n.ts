import { ref } from 'vue';
import type { EventCategoryKey } from '@/interfaces/event.interface';

export type SupportedLanguage = 'zh' | 'en';

const STORAGE_KEY = 'townpass_events_lang';

const storedLang = (
  typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : 'zh'
) as SupportedLanguage | null;

export const currentLang = ref<SupportedLanguage>(storedLang === 'en' ? 'en' : 'zh');

export function setLanguage(lang: SupportedLanguage) {
  currentLang.value = lang;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang);
  }
}

export function toggleLanguage() {
  setLanguage(currentLang.value === 'zh' ? 'en' : 'zh');
}

export const translations = {
  zh: {
    pageTitle: '活動與最新消息',
    pageSubtitle: '即時掌握臺北市勞動局最新活動、課程、補助與重要公告',
    dailyUpdateBadge: '每日定時更新',
    sourceLabel: '臺北市勞動局開放資料',
    refresh: '重新整理',
    refreshing: '更新中...',
    searchPlaceholder: '搜尋活動標題或關鍵字...',
    all: '全部',
    activity: '活動課程',
    subsidy: '補助獎勵',
    job: '職缺徵才',
    rule: '法規政策',
    announcement: '最新公告',
    sortNewest: '時間：最新優先 ↓',
    sortOldest: '時間：由舊到新 ↑',
    foundCount: '共找到 {count} 則活動',
    clearFilters: '清除條件',
    emptyTitle: '查無相符的活動資訊',
    emptyDesc: '請嘗試調整搜尋關鍵字，或切換至其他分類標籤。',
    resetFilters: '重設篩選條件',
    officialSite: '前往官方網站',
    viewDetails: '詳細資訊',
    collapse: '收合資訊',
    attachmentsCount: '相關附件 ({count})',
    lastChecked: '最後檢查更新時間：',
    fallbackNotice: '使用最新快照資料備援中',
    justNow: '剛剛',
    hoursAgo: '{h} 小時前',
    yesterday: '昨天',
    daysAgo: '{d} 天前',
    endOfTimeline: '已呈現全部 {count} 筆活動資訊',
    langName: '繁體中文',
    langToggleHint: 'Switch to English'
  },
  en: {
    pageTitle: 'Events & Updates',
    pageSubtitle: 'Upcoming events, training courses, job openings & news from Taipei City',
    dailyUpdateBadge: 'Daily Updates',
    sourceLabel: 'Taipei Labor Bureau Open Data',
    refresh: 'Refresh',
    refreshing: 'Updating...',
    searchPlaceholder: 'Search events, jobs, or keywords...',
    all: 'All',
    activity: 'Activities',
    subsidy: 'Subsidies',
    job: 'Careers',
    rule: 'Regulations',
    announcement: 'News',
    sortNewest: 'Newest First ↓',
    sortOldest: 'Oldest First ↑',
    foundCount: '{count} items found',
    clearFilters: 'Clear',
    emptyTitle: 'No Matching Events',
    emptyDesc: 'Try adjusting your search keywords or switching to another category.',
    resetFilters: 'Reset filters',
    officialSite: 'Official Site',
    viewDetails: 'Details',
    collapse: 'Collapse',
    attachmentsCount: 'Attachments ({count})',
    lastChecked: 'Last checked: ',
    fallbackNotice: 'Using latest snapshot backup',
    justNow: 'Just now',
    hoursAgo: '{h}h ago',
    yesterday: 'Yesterday',
    daysAgo: '{d}d ago',
    endOfTimeline: 'All {count} events displayed',
    langName: 'English',
    langToggleHint: '切換為繁體中文'
  }
};

export const categoryLabelsMap: Record<SupportedLanguage, Record<EventCategoryKey, string>> = {
  zh: {
    all: '全部',
    activity: '活動課程',
    subsidy: '補助獎勵',
    job: '職缺徵才',
    rule: '法規政策',
    announcement: '最新公告'
  },
  en: {
    all: 'All',
    activity: 'Activities',
    subsidy: 'Subsidies',
    job: 'Careers',
    rule: 'Regulations',
    announcement: 'News'
  }
};

export function t(
  key: keyof (typeof translations)['zh'],
  params?: Record<string, string | number>
): string {
  const lang = currentLang.value;
  let text = translations[lang]?.[key] ?? translations.zh[key] ?? '';
  if (params) {
    for (const [pKey, pVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    }
  }
  return text;
}

export function formatEventDate(
  timestamp: number,
  lang: SupportedLanguage = currentLang.value
): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (lang === 'en') {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

export function formatYearMonth(
  timestamp: number,
  lang: SupportedLanguage = currentLang.value
): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (lang === 'en') {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月`;
}

export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diffHours = Math.floor((now - timestamp) / (1000 * 60 * 60));
  if (diffHours < 24 && diffHours >= 0) {
    if (diffHours === 0) return t('justNow');
    return t('hoursAgo', { h: diffHours });
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return t('yesterday');
  if (diffDays > 1 && diffDays <= 7) return t('daysAgo', { d: diffDays });
  return '';
}
