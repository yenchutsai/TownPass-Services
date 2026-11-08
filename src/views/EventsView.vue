<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import EventTimelineItem from '@/components/molecules/EventTimelineItem.vue';
import { fetchBolaEvents } from '@/services/eventService';
import type { BolaEvent, BolaEventsFeedData, EventCategoryKey } from '@/interfaces/event.interface';
import { useI18n } from 'vue-i18n';
import { formatYearMonth } from '@/utils/localized-date';

const { t, locale } = useI18n({ useScope: 'global' });

const loading = ref(true);
const refreshing = ref(false);
const errorMsg = ref('');
const isFallbackData = ref(false);
const feedData = ref<BolaEventsFeedData | null>(null);

const searchQuery = ref('');
const selectedCategory = ref<EventCategoryKey>('all');
const sortOrder = ref<'desc' | 'asc'>('desc');

const categories: { key: EventCategoryKey }[] = [
  { key: 'all' },
  { key: 'activity' },
  { key: 'subsidy' },
  { key: 'job' },
  { key: 'rule' },
  { key: 'announcement' }
];

async function loadData(isManualRefresh = false) {
  if (isManualRefresh) {
    refreshing.value = true;
  } else {
    loading.value = true;
  }
  errorMsg.value = '';

  try {
    const { data, isFallback } = await fetchBolaEvents();
    feedData.value = data;
    isFallbackData.value = isFallback;
  } catch (err) {
    console.error('Failed to load events:', err);
    errorMsg.value = 'events.loadError';
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

onMounted(() => {
  loadData();
});

// Category item counts
const categoryCounts = computed(() => {
  const counts: Record<EventCategoryKey, number> = {
    all: 0,
    activity: 0,
    subsidy: 0,
    job: 0,
    rule: 0,
    announcement: 0
  };

  const list = feedData.value?.events || [];
  counts.all = list.length;
  for (const item of list) {
    if (counts[item.category] !== undefined) {
      counts[item.category]++;
    }
  }
  return counts;
});

// Filtered and sorted events
const filteredEvents = computed(() => {
  if (!feedData.value?.events) return [];

  let list = [...feedData.value.events];

  // Category filter
  if (selectedCategory.value !== 'all') {
    list = list.filter((event) => event.category === selectedCategory.value);
  }

  // Keyword search (searches Chinese and English fields)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter((event) => {
      if (event.title.toLowerCase().includes(q)) return true;
      if (event.titleEn && event.titleEn.toLowerCase().includes(q)) return true;
      if (event.summary.toLowerCase().includes(q)) return true;
      if (event.summaryEn && event.summaryEn.toLowerCase().includes(q)) return true;
      if (t(`events.${event.category}`).toLowerCase().includes(q)) return true;
      if (event.translations) {
        for (const tr of Object.values(event.translations)) {
          if (tr?.title && tr.title.toLowerCase().includes(q)) return true;
          if (tr?.summary && tr.summary.toLowerCase().includes(q)) return true;
        }
      }
      return false;
    });
  }

  // Sort by time
  list.sort((a, b) => {
    if (sortOrder.value === 'desc') {
      return b.timestamp - a.timestamp;
    }
    return a.timestamp - b.timestamp;
  });

  return list;
});

// Grouped by Year-Month milestones for timeline
interface TimelineGroup {
  yearMonth: string;
  events: BolaEvent[];
}

const groupedTimeline = computed<TimelineGroup[]>(() => {
  const groups: Map<string, BolaEvent[]> = new Map();

  for (const event of filteredEvents.value) {
    const key = formatYearMonth(event.timestamp, locale.value) || t('events.other');
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(event);
  }

  return Array.from(groups.entries()).map(([yearMonth, events]) => ({
    yearMonth,
    events
  }));
});

function clearFilters() {
  searchQuery.value = '';
  selectedCategory.value = 'all';
}
</script>

<template>
  <section class="events-panel" :aria-label="t('events.pageTitle')">
    <div class="events-container">
      <!-- Search & Filters Toolbar -->
      <div
        class="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-grey-100 mb-5 space-y-3"
      >
        <!-- Search and sort order -->
        <div class="flex flex-col sm:flex-row gap-2.5">
          <!-- Search input -->
          <div class="relative flex-1">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg
                class="w-4 h-4 text-grey-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('events.searchPlaceholder')"
              class="w-full pl-10 pr-9 py-2 bg-grey-50 border border-grey-200 rounded-xl text-xs sm:text-sm text-grey-800 placeholder-grey-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
            <button
              v-if="searchQuery"
              :aria-label="t('events.clearSearch')"
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-grey-400 hover:text-grey-600 cursor-pointer"
              @click="searchQuery = ''"
            >
              <svg
                class="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Sort order -->
          <div class="flex items-center gap-2 shrink-0">
            <!-- Sort Order Toggle Button -->
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer"
              :class="
                sortOrder === 'desc'
                  ? 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100'
                  : 'bg-grey-50 text-grey-700 border-grey-200 hover:bg-grey-100'
              "
              @click="sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'"
            >
              <svg
                class="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
              </svg>
              <span>
                {{ sortOrder === 'desc' ? t('events.sortNewest') : t('events.sortOldest') }}
              </span>
            </button>
          </div>
        </div>

        <!-- Category Filter Pills (Vector SVG Icons, NO emojis) -->
        <div class="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            v-for="cat in categories"
            :key="cat.key"
            type="button"
            class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer"
            :class="
              selectedCategory === cat.key
                ? 'bg-primary-500 text-white border-primary-500 shadow-xs'
                : 'bg-grey-50 text-grey-600 border-grey-200 hover:bg-grey-100'
            "
            @click="selectedCategory = cat.key"
          >
            <!-- Clean SVG Icons (no emojis) -->
            <svg
              v-if="cat.key === 'all'"
              class="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            <svg
              v-else-if="cat.key === 'activity'"
              class="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <svg
              v-else-if="cat.key === 'subsidy'"
              class="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="8" r="7" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
            <svg
              v-else-if="cat.key === 'job'"
              class="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <svg
              v-else-if="cat.key === 'rule'"
              class="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <svg
              v-else
              class="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>

            <span>{{ t(`events.${cat.key}`) }}</span>
            <span
              class="text-[10px] px-1.5 py-0.2 rounded-full"
              :class="
                selectedCategory === cat.key
                  ? 'bg-white/20 text-white'
                  : 'bg-grey-200 text-grey-600'
              "
            >
              {{ categoryCounts[cat.key] || 0 }}
            </span>
          </button>
        </div>

        <!-- Result count & reset -->
        <div class="flex items-center justify-between text-xs text-grey-500 pt-0.5">
          <div class="flex items-center gap-2">
            <span>{{ t('events.foundCount', { count: filteredEvents.length }) }}</span>
            <button
              type="button"
              class="inline-flex items-center gap-1 text-[11px] text-grey-400 hover:text-primary-600 cursor-pointer transition-colors"
              :disabled="refreshing || loading"
              :title="t('events.refresh')"
              @click="loadData(true)"
            >
              <svg
                class="w-3.5 h-3.5"
                :class="{ 'animate-spin': refreshing }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>{{ refreshing ? t('events.refreshing') : '' }}</span>
            </button>
            <span v-if="isFallbackData" class="text-orange-500 text-[11px] font-medium">
              ({{ t('events.fallbackNotice') }})
            </span>
          </div>
          <button
            v-if="searchQuery || selectedCategory !== 'all'"
            type="button"
            class="text-primary-600 hover:underline font-semibold cursor-pointer"
            @click="clearFilters"
          >
            {{ t('events.clearFilters') }}
          </button>
        </div>
      </div>

      <!-- Loading State: Skeleton Timeline -->
      <div v-if="loading" class="space-y-4 py-2">
        <div v-for="i in 4" :key="i" class="flex gap-3 sm:gap-4 animate-pulse">
          <div class="w-20 sm:w-24 shrink-0 text-right pr-1 pt-3 space-y-1">
            <div class="h-3.5 w-16 bg-grey-200 rounded ml-auto" />
            <div class="h-3 w-10 bg-grey-100 rounded ml-auto" />
          </div>
          <div class="flex flex-col items-center">
            <div class="w-2.5 h-2.5 rounded-full bg-grey-200 mt-4" />
            <div class="w-0.5 flex-1 bg-grey-200 mt-1" />
          </div>
          <div class="flex-1 pb-4">
            <div
              class="bg-white rounded-2xl p-4 sm:p-5 border border-grey-100 shadow-xs space-y-2.5"
            >
              <div class="h-3.5 w-24 bg-grey-200 rounded-full" />
              <div class="h-5 w-3/4 bg-grey-200 rounded" />
              <div class="h-3.5 w-full bg-grey-100 rounded" />
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="errorMsg"
        class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700 my-4"
      >
        <p class="font-bold text-base mb-1">{{ t('events.loadErrorTitle') }}</p>
        <p class="text-sm text-red-600 mb-3">{{ t(errorMsg) }}</p>
        <button
          type="button"
          class="px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
          @click="loadData()"
        >
          {{ t('events.refresh') }}
        </button>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredEvents.length === 0"
        class="bg-white rounded-2xl p-10 text-center border border-grey-100 shadow-xs my-4"
      >
        <div
          class="w-14 h-14 mx-auto mb-3 rounded-full bg-grey-50 flex items-center justify-center text-grey-400"
        >
          <svg
            class="w-7 h-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h3 class="text-base font-bold text-grey-800 mb-1">
          {{ t('events.emptyTitle') }}
        </h3>
        <p class="text-xs text-grey-500 max-w-sm mx-auto mb-3">
          {{ t('events.emptyDesc') }}
        </p>
        <button
          type="button"
          class="px-3.5 py-1.5 bg-primary-500 text-white rounded-xl text-xs font-bold hover:bg-primary-600 transition-colors cursor-pointer"
          @click="clearFilters"
        >
          {{ t('events.resetFilters') }}
        </button>
      </div>

      <!-- Timeline Content: Continuous Stream -->
      <div v-else class="relative timeline-wrapper pt-1">
        <div v-for="group in groupedTimeline" :key="group.yearMonth" class="mb-3">
          <!-- Milestone / Month Header -->
          <div class="flex items-center gap-2.5 mb-3 pl-2 sm:pl-3">
            <div
              class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500 text-white shadow-2xs"
            >
              <svg
                class="w-3 h-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
              </svg>
            </div>
            <div
              class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white border border-grey-200 shadow-2xs"
            >
              <span class="text-xs font-bold text-grey-800">{{ group.yearMonth }}</span>
              <span class="text-[10px] text-grey-500 font-medium">({{ group.events.length }})</span>
            </div>
            <div class="flex-1 h-px bg-gradient-to-r from-grey-200 to-transparent" />
          </div>

          <!-- Group Events -->
          <div class="timeline-group-items">
            <EventTimelineItem
              v-for="(event, eIdx) in group.events"
              :key="event.id"
              :event="event"
              :is-first="group === groupedTimeline[0] && eIdx === 0 && sortOrder === 'desc'"
              :is-last="
                group === groupedTimeline[groupedTimeline.length - 1] &&
                eIdx === group.events.length - 1
              "
            />
          </div>
        </div>

        <!-- End of timeline badge -->
        <div class="flex items-center justify-center gap-2 py-6 text-xs text-grey-400">
          <div class="w-10 h-px bg-grey-200" />
          <span>{{ t('events.endOfTimeline', { count: filteredEvents.length }) }}</span>
          <div class="w-10 h-px bg-grey-200" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.events-panel {
  box-sizing: border-box;
  height: calc(100vh - var(--service-chrome-height, 49px));
  height: calc(100dvh - var(--service-chrome-height, 49px));
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scrollbar-gutter: stable;
  padding: 16px 12px 36px;
  background: #f8fafc;
}

.events-container {
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
}

/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
