export type EventCategoryKey = 'all' | 'job' | 'activity' | 'subsidy' | 'rule' | 'announcement';

export interface BolaEventAttachment {
  title: string;
  url: string;
  type: string;
}

export interface EventTranslation {
  title: string;
  summary: string;
  source?: string;
  contentHtml?: string;
  attachments?: BolaEventAttachment[];
}

export interface BolaEvent {
  id: string;
  title: string;
  titleEn?: string;
  link: string;
  pubDate: string;
  isoDate: string;
  timestamp: number;
  formattedDate: string;
  formattedTime: string;
  yearMonth: string;
  category: EventCategoryKey;
  categoryLabel: string;
  categoryLabelEn?: string;
  source?: string;
  sourceEn?: string;
  summary: string;
  summaryEn?: string;
  contentHtml: string;
  attachments: BolaEventAttachment[];
  translations?: Partial<Record<string, EventTranslation>>;
}

export interface BolaEventsFeedData {
  title: string;
  sourceUrl: string;
  updatedAt: string;
  events: BolaEvent[];
}
