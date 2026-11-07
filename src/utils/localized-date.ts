import { currentLocale } from '@/i18n';
import type { AppLocale } from '@/i18n/config';

const timeZone = 'Asia/Taipei';

export function formatEventDate(timestamp: number, locale: AppLocale = currentLocale.value) {
  if (!timestamp) return '';
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    calendar: 'gregory',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(timestamp);
}

export function formatYearMonth(timestamp: number, locale: AppLocale = currentLocale.value) {
  if (!timestamp) return '';
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    calendar: 'gregory',
    year: 'numeric',
    month: 'long'
  }).format(timestamp);
}

export function formatDateTime(timestamp: number, locale: AppLocale = currentLocale.value) {
  if (!timestamp) return '';
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    calendar: 'gregory',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(timestamp);
}

export function formatRelativeTime(timestamp: number, locale: AppLocale = currentLocale.value) {
  const hours = Math.floor((Date.now() - timestamp) / 3_600_000);
  if (!timestamp || hours < 0 || hours > 7 * 24) return '';
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  return hours < 24
    ? formatter.format(-hours, 'hour')
    : formatter.format(-Math.floor(hours / 24), 'day');
}
