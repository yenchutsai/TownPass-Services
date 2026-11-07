export type EventCategoryKey = 'all' | 'job' | 'activity' | 'subsidy' | 'rule' | 'announcement';

export interface BolaEventAttachment {
  title: string;
  url: string;
  type: string;
}

export interface BolaEvent {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  isoDate: string;
  timestamp: number;
  formattedDate: string;
  formattedTime: string;
  yearMonth: string;
  category: EventCategoryKey;
  categoryLabel: string;
  summary: string;
  contentHtml: string;
  attachments: BolaEventAttachment[];
}

export interface BolaEventsFeedData {
  title: string;
  sourceUrl: string;
  updatedAt: string;
  events: BolaEvent[];
}

