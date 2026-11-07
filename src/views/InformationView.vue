<script setup lang="ts">
// 提供正式電話圖示後，替換這個 import 即可。
import phoneIcon from '@/assets/images/icon_tel.svg';
import placeholderIcon from '@/assets/images/info-icon-grey.svg';

const informationItems = [
  { id: 'phone', title: '電話', image: phoneIcon, pending: false },
  ...Array.from({ length: 7 }, (_, index) => ({
    id: `pending-${index + 1}`,
    title: '待定',
    image: placeholderIcon,
    pending: true
  }))
];
</script>

<template>
  <section class="information-view" aria-label="資訊" tabindex="0">
    <ul class="information-list">
      <li
        v-for="item in informationItems"
        :key="item.id"
        class="information-item"
        :class="{ 'information-item--pending': item.pending }"
      >
        <div class="information-image">
          <img :src="item.image" alt="" width="32" height="32" />
        </div>
        <p class="information-title" :title="item.title">{{ item.title }}</p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.information-view {
  box-sizing: border-box;
  height: calc(100vh - 49px);
  height: calc(100dvh - 49px);
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scrollbar-gutter: stable;
  padding: 16px;
  background: #fff;
}

.information-list {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
}

.information-item {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 104px;
  padding: 16px 8px;
  border-bottom: 1px solid #e3e7e9;
}

.information-image {
  display: flex;
  flex: 0 0 64px;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: #edf8fa;
  overflow: hidden;
}

.information-image img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.information-title {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #475259;
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.information-item--pending .information-image {
  background: #f1f3f4;
}

.information-item--pending .information-title {
  color: #91a0a8;
  font-weight: 400;
}

.information-view:focus-visible {
  outline: 2px solid #2eb6c7;
  outline-offset: -2px;
}
</style>
