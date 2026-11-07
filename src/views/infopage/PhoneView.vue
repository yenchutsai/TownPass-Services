<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import resources from '@/data/information-resources.json';

import phoneIcon from '@/assets/images/icon_tel.svg';

const { t } = useI18n({ useScope: 'global' });

const phoneNumbers = resources.phone;
</script>

<template>
  <section class="phone-view" aria-labelledby="phone-title" tabindex="0">
    <div class="phone-content">
      <header class="phone-header">
        <RouterLink :to="{ name: 'information' }" class="back-link">
          <span aria-hidden="true">←</span> {{ t('common.backToInformation') }}
        </RouterLink>
        <h1 id="phone-title">{{ t('information.sections.phone') }}</h1>
      </header>
      <ul class="phone-list">
        <li v-for="phone in phoneNumbers" :key="phone.number">
          <a
            :href="`tel:${phone.number}`"
            class="phone-row"
            :aria-label="
              t('common.call', { number: phone.number, description: t(phone.descriptionKey) })
            "
          >
            <p class="phone-description">
              <strong>{{ phone.number }}</strong>
              <span>：{{ t(phone.descriptionKey) }}</span>
            </p>
            <img :src="phoneIcon" alt="" width="24" height="24" />
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.phone-view {
  box-sizing: border-box;
  height: calc(100vh - var(--service-chrome-height, 49px));
  height: calc(100dvh - var(--service-chrome-height, 49px));
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scrollbar-gutter: stable;
  padding: 16px;
  background: #fff;
}

.phone-content {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
}

.phone-header {
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

.phone-header h1 {
  margin-top: 8px;
  color: #24484e;
  font-size: 24px;
  font-weight: 700;
}

.phone-list li {
  border-bottom: 1px solid #e3e7e9;
}

.phone-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 88px;
  padding: 20px 8px;
  color: #475259;
}

.phone-row:hover {
  background: #edf8fa;
}

.phone-description {
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.phone-description strong {
  color: #356c77;
  font-size: 18px;
  font-weight: 700;
}

.phone-row img {
  flex-shrink: 0;
}

.phone-view:focus-visible,
.phone-row:focus-visible,
.back-link:focus-visible {
  outline: 2px solid #2eb6c7;
  outline-offset: -2px;
}
</style>
