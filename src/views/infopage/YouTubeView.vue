<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import resources from '@/data/information-resources.json';

const { t } = useI18n({ useScope: 'global' });

const youtubeChannels = resources.youtube;
</script>

<template>
  <section class="youtube-view" aria-labelledby="youtube-title" tabindex="0">
    <div class="youtube-content">
      <header class="youtube-header">
        <RouterLink :to="{ name: 'information' }" class="back-link">
          <span aria-hidden="true">←</span> {{ t('common.backToInformation') }}
        </RouterLink>
        <h1 id="youtube-title">{{ t('information.sections.youtube') }}</h1>
      </header>
      <ul class="youtube-list">
        <li v-for="channel in youtubeChannels" :key="channel.id">
          <a
            :href="channel.url"
            class="youtube-row"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="t('common.openExternal', { title: t(channel.titleKey) })"
          >
            <p class="youtube-account-title">{{ t(channel.titleKey) }}</p>
            <span class="external-link-icon" aria-hidden="true">↗</span>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.youtube-view {
  box-sizing: border-box;
  height: calc(100vh - var(--service-chrome-height, 49px));
  height: calc(100dvh - var(--service-chrome-height, 49px));
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scrollbar-gutter: stable;
  padding: 16px;
  background: #fff;
}

.youtube-content {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
}

.youtube-header {
  padding: 8px 8px 16px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  color: #356c77;
  font-size: 14px;
}

.youtube-header h1 {
  margin-top: 8px;
  color: #24484e;
  font-size: 24px;
  font-weight: 700;
}

.youtube-list li {
  border-bottom: 1px solid #e3e7e9;
}

.youtube-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 88px;
  padding: 20px 8px;
  color: #475259;
}

.youtube-row:hover {
  background: #edf8fa;
}

.youtube-account-title {
  min-width: 0;
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.external-link-icon {
  flex-shrink: 0;
  color: #356c77;
  font-size: 24px;
}

.youtube-view:focus-visible,
.youtube-row:focus-visible,
.back-link:focus-visible {
  outline: 2px solid #2eb6c7;
  outline-offset: -2px;
}
</style>
