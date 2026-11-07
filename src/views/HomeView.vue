<script setup lang="ts">
import { ref } from 'vue';
import ServiceTabsView from '@/components/organisms/ServiceTabsView.vue';
import TaipeiMap from '@/components/organisms/TaipeiMap.vue';

const activeTab = ref(1);
const tabList = [
  { id: 1, title: '申辦' },
  { id: 2, title: '台北地圖' }
];
</script>

<template>
  <main>
    <ServiceTabsView v-model="activeTab" :tab-list="tabList">
      <template #tab0>
        <div />
      </template>
      <template #tab1>
        <TaipeiMap v-if="activeTab === 1" />
      </template>
    </ServiceTabsView>
  </main>
</template>
