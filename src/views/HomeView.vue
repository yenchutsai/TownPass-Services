<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { useI18n } from 'vue-i18n';
import LanguageSelector from '@/components/layout/LanguageSelector.vue';

const { t } = useI18n({ useScope: 'global' });

const tabs = [
  { route: 'information', titleKey: 'common.information' },
  { route: 'living-map', titleKey: 'common.livingMap' },
  { route: 'events', titleKey: 'common.events' }
];
</script>

<template>
  <main class="service-shell">
    <nav class="home-tabs" :aria-label="t('common.mainNavigation')">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.route"
        :to="{ name: tab.route }"
        class="home-tab"
        active-class="home-tab--active"
      >
        {{ t(tab.titleKey) }}
      </RouterLink>
    </nav>
    <LanguageSelector />
    <RouterView />
  </main>
</template>

<style scoped>
.service-shell {
  --service-chrome-height: 49px;
}
.home-tabs {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 0 16px;
  border-bottom: 1px solid #adb8be;
  background: #fff;
}
.home-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 12px 8px;
  border-bottom: 2px solid transparent;
  background: #fff;
  color: #475259;
  font-weight: 700;
  cursor: pointer;
}
.home-tab--active {
  border-bottom-color: #2eb6c7;
  color: #2eb6c7;
}
.home-tab:focus-visible {
  outline: 2px solid #2eb6c7;
  outline-offset: -4px;
}
</style>
