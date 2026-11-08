<script setup lang="ts">
import { computed, ref } from 'vue';
import type { BolaEvent, EventCategoryKey } from '@/interfaces/event.interface';
import { useI18n } from 'vue-i18n';
import { formatEventDate, formatRelativeTime } from '@/utils/localized-date';

const { t, locale } = useI18n({ useScope: 'global' });

const props = defineProps<{
  event: BolaEvent;
  isFirst?: boolean;
  isLast?: boolean;
}>();

const isExpanded = ref(false);

const isNonChinese = computed(() => locale.value !== 'zh-TW');

const currentTranslation = computed(() => {
  return props.event.translations?.[locale.value];
});

const displayTitle = computed(() => {
  if (isNonChinese.value) {
    if (currentTranslation.value?.title) {
      return currentTranslation.value.title;
    }
    if (props.event.titleEn) {
      return props.event.titleEn;
    }
  }
  return props.event.title;
});

const displaySummary = computed(() => {
  if (isNonChinese.value) {
    if (currentTranslation.value?.summary) {
      return currentTranslation.value.summary;
    }
    if (props.event.summaryEn) {
      return props.event.summaryEn;
    }
  }
  return props.event.summary;
});

const categoryLabel = computed(() => {
  return t(`events.${props.event.category}`);
});

const displayContentHtml = computed(() => {
  if (isNonChinese.value) {
    if (currentTranslation.value?.contentHtml) {
      return currentTranslation.value.contentHtml;
    }
    const enHtml = props.event.translations?.en?.contentHtml;
    if (enHtml) return enHtml;
    return '';
  }
  return props.event.contentHtml || '';
});

const displayAttachments = computed(() => {
  if (isNonChinese.value) {
    if (currentTranslation.value?.attachments && currentTranslation.value.attachments.length > 0) {
      return currentTranslation.value.attachments;
    }
    const enAtt = props.event.translations?.en?.attachments;
    if (enAtt && enAtt.length > 0) return enAtt;
  }
  return props.event.attachments || [];
});

const formattedDateStr = computed(() => {
  return formatEventDate(props.event.timestamp, locale.value);
});

const relativeTimeStr = computed(() => {
  return formatRelativeTime(props.event.timestamp, locale.value);
});

const isRecent = computed(() => {
  const age = Date.now() - props.event.timestamp;
  return age >= 0 && age < 86_400_000;
});

const categoryStyles = computed(() => {
  const map: Record<EventCategoryKey, { badge: string; dot: string; text: string }> = {
    all: {
      badge: 'bg-grey-100 text-grey-700 border-grey-200',
      dot: 'bg-grey-400',
      text: 'text-grey-700'
    },
    activity: {
      badge: 'bg-orange-50 text-orange-700 border-orange-200',
      dot: 'bg-orange-500',
      text: 'text-orange-700'
    },
    job: {
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-600',
      text: 'text-purple-700'
    },
    subsidy: {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      text: 'text-emerald-700'
    },
    rule: {
      badge: 'bg-primary-50 text-primary-700 border-primary-200',
      dot: 'bg-primary-500',
      text: 'text-primary-700'
    },
    announcement: {
      badge: 'bg-sky-50 text-sky-700 border-sky-200',
      dot: 'bg-sky-500',
      text: 'text-sky-700'
    }
  };
  return map[props.event.category] || map.announcement;
});

function toggleExpanded() {
  isExpanded.value = !isExpanded.value;
}
</script>

<template>
  <div class="relative flex gap-3 sm:gap-4 pb-3 sm:pb-4 group">
    <!-- Left Column: Time (Date) -->
    <div class="w-20 sm:w-24 shrink-0 text-right pr-1 pt-3">
      <div class="text-xs sm:text-sm font-bold text-grey-800 leading-tight">
        {{ formattedDateStr }}
      </div>
      <div v-if="props.event.formattedTime" class="text-[11px] text-grey-400 mt-0.5 font-medium">
        {{ props.event.formattedTime }}
      </div>
      <div
        v-if="relativeTimeStr"
        class="text-[10px] font-semibold mt-1 inline-block px-1.5 py-0.2 rounded"
        :class="isRecent ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-700'"
      >
        {{ relativeTimeStr }}
      </div>
    </div>

    <!-- Continuous Vertical Timeline Rail & Node Dot -->
    <div class="relative flex flex-col items-center shrink-0">
      <!-- Node Dot -->
      <div
        class="relative z-10 w-2.5 h-2.5 rounded-full mt-4 ring-4 ring-white shadow-2xs"
        :class="categoryStyles.dot"
      >
        <!-- Pulsing indicator if first/newest item -->
        <span v-if="props.isFirst" class="absolute -top-1 -right-1 flex h-2 w-2">
          <span
            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
          ></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      </div>

      <!-- Continuous vertical line -->
      <div class="w-0.5 flex-1 bg-grey-200 mt-1" :class="{ 'opacity-0': props.isLast }" />
    </div>

    <!-- Event Card (Box) -->
    <div class="flex-1 min-w-0">
      <div
        class="bg-white rounded-2xl p-4 sm:p-5 border border-grey-100 shadow-xs hover:shadow-md transition-all duration-200 hover:border-primary-200"
      >
        <!-- Upper part of the box: Reserve the tag, remove the date -->
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
          <!-- Category Tag with clean SVG icon (NO emoji) -->
          <span
            class="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-2xs"
            :class="categoryStyles.badge"
          >
            <!-- SVG Icon by category -->
            <svg
              v-if="props.event.category === 'activity'"
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
              v-else-if="props.event.category === 'job'"
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
              v-else-if="props.event.category === 'subsidy'"
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
              v-else-if="props.event.category === 'rule'"
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
            <span>{{ categoryLabel }}</span>
          </span>

          <!-- Compact Attachment Badge (if any) -->
          <div
            v-if="props.event.attachments && props.event.attachments.length > 0"
            class="inline-flex items-center gap-1 text-[11px] font-semibold text-grey-500 bg-grey-50 px-2 py-0.5 rounded-md border border-grey-200"
            :title="t('events.attachmentsCount', { count: props.event.attachments.length })"
          >
            <svg
              class="w-3 h-3 text-grey-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
              />
            </svg>
            <span class="text-[10px] uppercase font-bold text-grey-600">
              {{ props.event.attachments[0].type }}
            </span>
          </div>
        </div>

        <!-- Event Title -->
        <h3
          class="text-sm sm:text-base font-bold text-grey-800 leading-snug mb-2 group-hover:text-primary-700 transition-colors"
        >
          <a
            :href="props.event.link"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:underline focus:outline-none focus:text-primary-600"
            :title="t('events.openOfficial', { title: displayTitle })"
          >
            {{ displayTitle }}
          </a>
        </h3>

        <!-- Collapsible Summary / HTML Details / Attachments -->
        <div v-if="isExpanded" class="mt-3 pt-3 border-t border-grey-100 space-y-3">
          <p
            v-if="displaySummary"
            class="text-xs sm:text-sm text-grey-600 leading-relaxed p-3 rounded-xl bg-grey-50/70 border border-grey-100"
          >
            {{ displaySummary }}
          </p>

          <div
            v-if="displayContentHtml"
            class="event-html-content text-xs text-grey-600 max-w-none break-words space-y-1.5"
            v-html="displayContentHtml"
          />

          <!-- Downloadable Attachments -->
          <div v-if="displayAttachments && displayAttachments.length > 0" class="pt-2">
            <div class="text-[11px] font-bold text-grey-500 mb-1.5 flex items-center gap-1">
              <span>
                {{ t('events.attachmentsCount', { count: displayAttachments.length }) }}：
              </span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <a
                v-for="(file, fIdx) in displayAttachments"
                :key="fIdx"
                :href="file.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-grey-200 bg-white hover:bg-primary-50 hover:border-primary-300 text-grey-700 transition-colors"
                :title="file.title"
              >
                <span
                  class="uppercase font-extrabold text-[9px] px-1 py-0.2 rounded"
                  :class="
                    file.type === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  "
                >
                  {{ file.type }}
                </span>
                <span class="truncate max-w-[180px]">{{ file.title }}</span>
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
        </div>

        <!-- Card Footer Actions: Details & Official Link -->
        <div class="mt-2.5 pt-2 border-t border-grey-100 flex items-center justify-between gap-2">
          <!-- Toggle Details -->
          <button
            type="button"
            class="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-grey-500 hover:text-primary-600 transition-colors py-1 cursor-pointer"
            @click="toggleExpanded"
          >
            <span>{{ isExpanded ? t('events.collapse') : t('events.viewDetails') }}</span>
            <svg
              class="w-3 h-3 transition-transform duration-200"
              :class="{ 'rotate-180': isExpanded }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <!-- Official Link Button -->
          <a
            :href="props.event.link"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary-500 text-white hover:bg-primary-600 active:scale-95 transition-all shadow-2xs focus:ring-2 focus:ring-primary-400 focus:outline-none"
            :title="t('events.openOfficial', { title: displayTitle })"
          >
            <span>{{ t('events.officialSite') }}</span>
            <svg
              class="w-3 h-3 text-white"
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
  margin-bottom: 0.35rem;
  line-height: 1.5;
}

.event-html-content :deep(ul) {
  list-style-type: disc;
  padding-left: 1.25rem;
  margin-bottom: 0.35rem;
}
</style>
