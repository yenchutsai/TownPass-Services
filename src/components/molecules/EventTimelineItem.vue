<script setup lang="ts">
import { computed, ref } from 'vue';
import type { BolaEvent, EventCategoryKey } from '@/interfaces/event.interface';

const props = defineProps<{
  event: BolaEvent;
  isFirst?: boolean;
  isLast?: boolean;
}>();

const isExpanded = ref(false);

const categoryBadgeClass = computed(() => {
  const map: Record<EventCategoryKey, string> = {
    all: 'bg-grey-100 text-grey-700 border-grey-200',
    activity: 'bg-orange-50 text-orange-600 border-orange-200',
    job: 'bg-purple-50 text-purple-600 border-purple-200',
    subsidy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rule: 'bg-primary-50 text-primary-700 border-primary-200',
    announcement: 'bg-grey-100 text-grey-700 border-grey-200'
  };
  return map[props.event.category] || map.announcement;
});

const timelineDotClass = computed(() => {
  const map: Record<EventCategoryKey, string> = {
    all: 'bg-grey-400 ring-grey-100',
    activity: 'bg-orange-500 ring-orange-100',
    job: 'bg-purple-600 ring-purple-100',
    subsidy: 'bg-emerald-500 ring-emerald-100',
    rule: 'bg-primary-500 ring-primary-100',
    announcement: 'bg-grey-500 ring-grey-100'
  };
  return map[props.event.category] || map.announcement;
});

const relativeTime = computed(() => {
  if (!props.event.timestamp) return '';
  const now = Date.now();
  const diffHours = Math.floor((now - props.event.timestamp) / (1000 * 60 * 60));
  if (diffHours < 24 && diffHours >= 0) {
    if (diffHours === 0) return '剛剛';
    return `${diffHours} 小時前`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '昨天';
  if (diffDays > 1 && diffDays <= 7) return `${diffDays} 天前`;
  return '';
});

function toggleExpanded() {
  isExpanded.value = !isExpanded.value;
}
</script>

<template>
  <div class="relative flex gap-4 md:gap-6 group">
    <!-- Timeline Vertical Line & Node -->
    <div class="flex flex-col items-center">
      <!-- Node Dot -->
      <div
        class="relative z-10 flex items-center justify-center w-8 h-8 rounded-full shadow-sm ring-4 transition-transform group-hover:scale-110"
        :class="timelineDotClass"
      >
        <!-- Icon inside dot based on category -->
        <svg
          v-if="props.event.category === 'activity'"
          class="w-4 h-4 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M8 2v4M16 2v4M3 10h18" />
          <rect x="3" y="4" width="18" height="18" rx="2" />
        </svg>
        <svg
          v-else-if="props.event.category === 'job'"
          class="w-4 h-4 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
        <svg
          v-else-if="props.event.category === 'subsidy'"
          class="w-4 h-4 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="8" r="7" />
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
        <svg
          v-else-if="props.event.category === 'rule'"
          class="w-4 h-4 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <svg
          v-else
          class="w-4 h-4 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>

        <!-- Pulsing indicator if first/newest item -->
        <span v-if="props.isFirst" class="absolute -top-1 -right-1 flex h-3 w-3">
          <span
            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
          ></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      </div>

      <!-- Connecting vertical line -->
      <div
        v-if="!props.isLast"
        class="w-0.5 flex-1 bg-gradient-to-b from-grey-200 via-grey-200 to-grey-100 my-1"
      />
    </div>

    <!-- Event Card -->
    <div class="flex-1 pb-8">
      <div
        class="bg-white rounded-2xl p-5 border border-grey-100 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary-200"
      >
        <!-- Header: Date, Time & Category -->
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div class="flex items-center gap-2">
            <!-- Date badge -->
            <div
              class="inline-flex items-center gap-1.5 text-xs font-semibold text-grey-700 bg-grey-50 px-2.5 py-1 rounded-full border border-grey-200"
            >
              <svg
                class="w-3.5 h-3.5 text-grey-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{{ props.event.formattedDate }}</span>
              <span v-if="props.event.formattedTime" class="text-grey-400 font-normal">
                {{ props.event.formattedTime }}
              </span>
            </div>

            <!-- Relative Time badge -->
            <span
              v-if="relativeTime"
              class="text-xs px-2 py-0.5 rounded-full font-medium"
              :class="
                relativeTime === '剛剛' || relativeTime.includes('小時')
                  ? 'bg-red-50 text-red-600 font-semibold'
                  : 'bg-primary-50 text-primary-700'
              "
            >
              {{ relativeTime }}
            </span>
          </div>

          <!-- Category Pill -->
          <span
            class="text-xs px-2.5 py-1 rounded-full border font-medium inline-flex items-center gap-1"
            :class="categoryBadgeClass"
          >
            {{ props.event.categoryLabel }}
          </span>
        </div>

        <!-- Event Title -->
        <h3
          class="text-base md:text-lg font-bold text-grey-800 leading-snug mb-2 group-hover:text-primary-700 transition-colors"
        >
          <a
            :href="props.event.link"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:underline focus:outline-none focus:text-primary-600"
            :title="`前往外部官方頁面：${props.event.title}`"
          >
            {{ props.event.title }}
          </a>
        </h3>

        <!-- Summary text preview -->
        <p
          v-if="props.event.summary"
          class="text-sm text-grey-600 leading-relaxed mb-3"
          :class="{ 'line-clamp-2': !isExpanded }"
        >
          {{ props.event.summary }}
        </p>

        <!-- Expanded Full Content (if toggle opened) -->
        <div
          v-if="isExpanded && props.event.contentHtml"
          class="mt-3 pt-3 border-t border-grey-100 text-sm text-grey-700 overflow-x-auto space-y-2"
        >
          <div
            class="event-html-content prose prose-sm max-w-none break-words"
            v-html="props.event.contentHtml"
          />
        </div>

        <!-- Attachments Section (PDF, ODT, etc.) -->
        <div
          v-if="props.event.attachments && props.event.attachments.length > 0"
          class="mt-3 pt-3 border-t border-grey-100"
        >
          <div class="text-xs font-semibold text-grey-500 mb-2 flex items-center gap-1">
            <svg
              class="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
              />
            </svg>
            <span>相關附件下載 ({{ props.event.attachments.length }})：</span>
          </div>

          <div class="flex flex-wrap gap-2">
            <a
              v-for="(file, fileIdx) in props.event.attachments"
              :key="fileIdx"
              :href="file.url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-grey-200 bg-grey-50 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 text-grey-700 transition-colors"
              :title="`下載：${file.title}`"
            >
              <span
                class="uppercase font-bold text-[10px] px-1 py-0.5 rounded"
                :class="
                  file.type === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                "
              >
                {{ file.type }}
              </span>
              <span class="truncate max-w-[200px]">{{ file.title }}</span>
              <svg
                class="w-3 h-3 text-grey-400 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </a>
          </div>
        </div>

        <!-- Footer Actions: Toggle Details & Delegate to official website -->
        <div class="mt-4 pt-3 border-t border-grey-100 flex items-center justify-between gap-3">
          <!-- Toggle details button -->
          <button
            v-if="
              props.event.summary.length > 80 ||
              (props.event.attachments && props.event.attachments.length > 0)
            "
            type="button"
            class="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors py-1"
            @click="toggleExpanded"
          >
            <span>{{ isExpanded ? '收合內容' : '閱讀完整資訊' }}</span>
            <svg
              class="w-3.5 h-3.5 transition-transform duration-200"
              :class="{ 'rotate-180': isExpanded }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div v-else />

          <!-- Delegate link to original website -->
          <a
            :href="props.event.link"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-50 text-primary-600 hover:bg-primary-500 hover:text-white border border-primary-200 transition-all duration-150 shadow-xs focus:ring-2 focus:ring-primary-400 focus:outline-none"
            :title="`前往原網站查看：${props.event.title}`"
          >
            <span>前往官方網站</span>
            <svg
              class="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-html-content :deep(a) {
  color: #2eb6c7;
  text-decoration: underline;
  word-break: break-all;
}

.event-html-content :deep(p) {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.event-html-content :deep(ul) {
  list-style-type: disc;
  padding-left: 1.25rem;
  margin-bottom: 0.5rem;
}
</style>
