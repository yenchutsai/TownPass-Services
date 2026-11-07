<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
// 提供正式電話圖示後，替換這個 import 即可。
import phoneIcon from '@/assets/images/icon_tel.svg';

type InformationItem = {
  id: string;
  title: string;
  image: string;
  routeName?: string;
};

const informationItems: InformationItem[] = [
  { id: 'phone', title: '電話', image: phoneIcon, routeName: 'phone' },
  { id: 'line', title: 'LINE', image: '', routeName: 'line' },
  { id: 'facebook', title: 'Facebook', image: '', routeName: 'facebook' },
  { id: 'website', title: '網站', image: '', routeName: 'website' },
  { id: 'youtube', title: 'YouTube', image: '', routeName: 'youtube' },
  { id: 'radio', title: '廣播', image: '', routeName: 'radio' }
];
</script>

<template>
  <RouterView v-slot="{ Component }">
    <component :is="Component" v-if="Component" />
    <section v-else class="information-view" aria-label="資訊" tabindex="0">
      <ul class="information-list">
        <li v-for="item in informationItems" :key="item.id" class="information-item">
          <component
            :is="item.routeName ? RouterLink : 'div'"
            :to="item.routeName ? { name: item.routeName } : undefined"
            class="information-row"
          >
            <div class="information-image">
              <span v-if="item.id === 'line'" class="line-icon" aria-hidden="true">LINE</span>
              <span v-else-if="item.id === 'website'" class="website-icon" aria-hidden="true"
                >🌐</span
              >
              <span v-else-if="item.id === 'facebook'" class="facebook-icon" aria-hidden="true"
                >f</span
              >
              <span v-else-if="item.id === 'youtube'" class="youtube-icon" aria-hidden="true"
                >▶</span
              >
              <span v-else-if="item.id === 'radio'" class="radio-icon" aria-hidden="true">📻</span>
              <img v-else :src="item.image" alt="" width="32" height="32" />
            </div>
            <p class="information-title" :title="item.title">{{ item.title }}</p>
          </component>
        </li>
      </ul>
    </section>
  </RouterView>
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
  border-bottom: 1px solid #e3e7e9;
}

.information-row {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 104px;
  padding: 16px 8px;
}

a.information-row:hover {
  background: #edf8fa;
}

.information-row:focus-visible {
  outline: 2px solid #2eb6c7;
  outline-offset: -2px;
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

.line-icon,
.facebook-icon,
.website-icon,
.youtube-icon,
.radio-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: #fff;
  font-weight: 700;
}

.line-icon {
  background: #06c755;
  font-size: 12px;
}

.facebook-icon {
  background: #1877f2;
  font-size: 28px;
}

.website-icon {
  background: #468d9b;
  font-size: 28px;
}

.youtube-icon {
  background: #f00;
  font-size: 20px;
}

.radio-icon {
  background: #b07d2c;
  font-size: 26px;
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

.information-view:focus-visible {
  outline: 2px solid #2eb6c7;
  outline-offset: -2px;
}
</style>
