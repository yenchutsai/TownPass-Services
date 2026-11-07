<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import EventTimelineItem from '@/components/molecules/EventTimelineItem.vue';
import { fetchBolaEvents } from '@/services/eventService';
import type { BolaEvent, BolaEventsFeedData, EventCategoryKey } from '@/interfaces/event.interface';

const loading = ref(true);
const refreshing = ref(false);
const errorMsg = ref('');
const isFallbackData = ref(false);
const feedData = ref<BolaEventsFeedData | null>(null);

const searchQuery = ref('');
const selectedCategory = ref<EventCategoryKey>('all');
const sortOrder = ref<'desc' | 'asc'>('desc');
const lastUpdatedTime = ref<string>('');

const categories: { key: EventCategoryKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'activity', label: '活動報名' },
  { key: 'subsidy', label: '補助獎勵' },
  { key: 'job', label: '職缺徵才' },
  { key: 'rule', label: '法規政策' },
  { key: 'announcement', label: '最新公告' }
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
    const now = new Date();
    lastUpdatedTime.value = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  } catch (err) {
    console.error('Failed to load events:', err);
    errorMsg.value = '無法載入活動開放資料，請檢查網路連線或稍後再試。';
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

  // Keyword search
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter(
      (event) =>
        event.title.toLowerCase().includes(q) ||
        event.summary.toLowerCase().includes(q) ||
        event.categoryLabel.toLowerCase().includes(q)
    );
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
    const key = event.yearMonth || '未分類日期';
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
  <section class="events-panel" aria-label="活動與消息">
    <div class="events-container">
      <!-- Top Header & Live Source Card -->
      <div class="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-grey-100 mb-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                每日定時更新
              </span>
              <span class="text-xs text-grey-400 font-medium">臺北市政府勞動局開放資料</span>
            </div>
            <h1 class="text-2xl md:text-3xl font-extrabold text-grey-900 tracking-tight">
              活動與最新消息
            </h1>
            <p class="text-sm text-grey-500 mt-1">
              依時間軸呈現最新公告、職缺招募、職業訓練課程與各項補助計畫
            </p>
          </div>

          <!-- Live Refresh & Open Data Link -->
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-grey-50 text-grey-700 hover:bg-grey-100 border border-grey-200 transition-colors disabled:opacity-50 cursor-pointer"
              :disabled="refreshing || loading"
              @click="loadData(true)"
            >
              <svg
                class="w-3.5 h-3.5 text-grey-600"
                :class="{ 'animate-spin': refreshing }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>{{ refreshing ? '更新中...' : '重新整理' }}</span>
            </button>

            <a
              href="https://bola.gov.taipei/OpenData.aspx?SN=B475EA5A93126B2E"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary-50 text-primary-600 hover:bg-primary-100 border border-primary-200 transition-colors"
              title="前往臺北市政府勞動局開放資料來源"
            >
              <span>開放資料來源</span>
              <svg
                class="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        </div>

        <!-- Last updated timestamp -->
        <div
          v-if="lastUpdatedTime"
          class="mt-4 pt-3 border-t border-grey-100 text-xs text-grey-400 flex items-center justify-between"
        >
          <span>最後檢查更新時間：{{ lastUpdatedTime }}</span>
          <span v-if="isFallbackData" class="text-orange-500 font-medium">
            使用最新快照資料備援中
          </span>
        </div>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-grey-100 mb-6 space-y-4">
        <!-- Search bar & Sort order -->
        <div class="flex flex-col sm:flex-row gap-3">
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
              placeholder="搜尋活動標題、內容或職缺關鍵字..."
              class="w-full pl-10 pr-9 py-2.5 bg-grey-50 border border-grey-200 rounded-xl text-sm text-grey-800 placeholder-grey-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
            <button
              v-if="searchQuery"
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

          <!-- Sort Order Toggle Button -->
          <div class="flex items-center shrink-0">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors w-full sm:w-auto justify-center cursor-pointer"
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
              <span>{{ sortOrder === 'desc' ? '時間：最新優先 ↓' : '時間：由舊到新 ↑' }}</span>
            </button>
          </div>
        </div>

        <!-- Category Filter Pills -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            v-for="cat in categories"
            :key="cat.key"
            type="button"
            class="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer"
            :class="
              selectedCategory === cat.key
                ? 'bg-primary-500 text-white border-primary-500 shadow-xs'
                : 'bg-grey-50 text-grey-600 border-grey-200 hover:bg-grey-100'
            "
            @click="selectedCategory = cat.key"
          >
            <span>{{ cat.label }}</span>
            <span
              class="text-[11px] px-1.5 py-0.2 rounded-full"
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

        <!-- Filter Result summary -->
        <div class="flex items-center justify-between text-xs text-grey-500 pt-1">
          <span>
            共找到
            <strong class="text-primary-600 font-bold">{{ filteredEvents.length }}</strong>
            則活動與資訊
          </span>
          <button
            v-if="searchQuery || selectedCategory !== 'all'"
            type="button"
            class="text-primary-600 hover:underline font-medium cursor-pointer"
            @click="clearFilters"
          >
            清除篩選條件
          </button>
        </div>
      </div>

      <!-- Loading State: Skeleton Timeline -->
      <div v-if="loading" class="space-y-6 py-4">
        <div v-for="i in 4" :key="i" class="flex gap-4 md:gap-6 animate-pulse">
          <div class="flex flex-col items-center">
            <div class="w-8 h-8 rounded-full bg-grey-200" />
            <div class="w-0.5 flex-1 bg-grey-200 my-1" />
          </div>
          <div class="flex-1 pb-8">
            <div class="bg-white rounded-2xl p-5 border border-grey-100 shadow-sm space-y-3">
              <div class="h-4 w-32 bg-grey-200 rounded" />
              <div class="h-6 w-3/4 bg-grey-200 rounded" />
              <div class="h-4 w-full bg-grey-100 rounded" />
              <div class="h-4 w-2/3 bg-grey-100 rounded" />
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="errorMsg"
        class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700 my-6"
      >
        <p class="font-bold text-base mb-2">載入活動資料時發生錯誤</p>
        <p class="text-sm text-red-600 mb-4">{{ errorMsg }}</p>
        <button
          type="button"
          class="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
          @click="loadData()"
        >
          重新載入
        </button>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredEvents.length === 0"
        class="bg-white rounded-2xl p-12 text-center border border-grey-100 shadow-sm my-6"
      >
        <div
          class="w-16 h-16 mx-auto mb-4 rounded-full bg-grey-50 flex items-center justify-center text-grey-400"
        >
          <svg
            class="w-8 h-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h3 class="text-lg font-bold text-grey-800 mb-1">查無相符的活動資訊</h3>
        <p class="text-sm text-grey-500 max-w-sm mx-auto mb-4">
          請嘗試調整搜尋關鍵字，或切換至其他分類標籤進行檢視。
        </p>
        <button
          type="button"
          class="px-4 py-2 bg-primary-500 text-white rounded-xl text-xs font-bold hover:bg-primary-600 transition-colors cursor-pointer"
          @click="clearFilters"
        >
          重設篩選條件
        </button>
      </div>

      <!-- Timeline Content -->
      <div v-else class="relative timeline-wrapper pt-2">
        <div v-for="group in groupedTimeline" :key="group.yearMonth" class="mb-6">
          <!-- Milestone / Month Header -->
          <div class="flex items-center gap-3 mb-6">
            <div
              class="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 text-white shadow-sm ring-4 ring-primary-100"
            >
              <svg
                class="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
              </svg>
            </div>
            <div
              class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-grey-200 shadow-xs"
            >
              <span class="text-xs font-bold text-grey-800 tracking-wide">
                {{ group.yearMonth }}
              </span>
              <span class="text-[11px] text-grey-500">({{ group.events.length }} 則)</span>
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
        <div class="flex items-center justify-center gap-2 py-8 text-xs text-grey-400">
          <div class="w-12 h-px bg-grey-200" />
          <span>已呈現全部 {{ filteredEvents.length }} 筆活動資訊</span>
          <div class="w-12 h-px bg-grey-200" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.events-panel {
  box-sizing: border-box;
  height: calc(100vh - 49px);
  height: calc(100dvh - 49px);
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scrollbar-gutter: stable;
  padding: 20px 16px 40px;
  background: #f8fafc;
}

.events-container {
  width: 100%;
  max-width: 860px;
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
