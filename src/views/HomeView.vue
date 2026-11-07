<script setup lang="ts">
import { ref } from 'vue';
import TaipeiMap from '@/components/organisms/TaipeiMap.vue';

const activeTab = ref(1);
const tabList = [
  { id: 1, title: '資訊' },
  { id: 2, title: '生活地圖' },
  { id: 3, title: '活動' }
];

function focusTab(index: number, event: KeyboardEvent) {
  activeTab.value = (index + tabList.length) % tabList.length;
  const buttons = (event.currentTarget as HTMLButtonElement).parentElement?.querySelectorAll(
    'button'
  );
  buttons?.[activeTab.value]?.focus();
}
</script>

<template>
  <main>
    <nav class="home-tabs" role="tablist" aria-label="主要功能">
      <button
        v-for="(tab, index) in tabList"
        :id="`home-tab-${tab.id}`"
        :key="tab.id"
        type="button"
        role="tab"
        class="home-tab"
        :class="{ 'home-tab--active': activeTab === index }"
        :aria-selected="activeTab === index"
        :aria-controls="`home-panel-${tab.id}`"
        :tabindex="activeTab === index ? 0 : -1"
        @click="activeTab = index"
        @keydown.left.prevent="focusTab(index - 1, $event)"
        @keydown.right.prevent="focusTab(index + 1, $event)"
        @keydown.home.prevent="focusTab(0, $event)"
        @keydown.end.prevent="focusTab(tabList.length - 1, $event)"
      >
        {{ tab.title }}
      </button>
    </nav>
    <section
      v-for="(tab, index) in tabList"
      :id="`home-panel-${tab.id}`"
      :key="tab.id"
      role="tabpanel"
      :aria-labelledby="`home-tab-${tab.id}`"
      :hidden="activeTab !== index"
      tabindex="0"
    >
      <TaipeiMap v-if="index === 1 && activeTab === 1" />
    </section>
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
