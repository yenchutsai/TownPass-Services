<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';

const tabs = [
  { route: 'information', title: '資訊' },
  { route: 'living-map', title: '生活地圖' },
  { route: 'events', title: '活動' }
];
</script>

<template>
  <main>
    <nav class="home-tabs" aria-label="主要功能">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.route"
        :to="{ name: tab.route }"
        class="home-tab"
        active-class="home-tab--active"
      >
        {{ tab.title }}
      </RouterLink>
    </nav>
    <RouterView />
  </main>
</template>

<style scoped>
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
