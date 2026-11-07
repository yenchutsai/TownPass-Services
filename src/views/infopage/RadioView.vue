<script setup lang="ts">
import { RouterLink } from 'vue-router';

const radioPrograms = [
  {
    id: 'taiwan-radio',
    title: '台灣廣播公司移工節目',
    url: 'https://www.taiwanradio.com.tw/'
  }
];
</script>

<template>
  <section class="radio-view" aria-labelledby="radio-title" tabindex="0">
    <div class="radio-content">
      <header class="radio-header">
        <RouterLink :to="{ name: 'information' }" class="back-link">
          <span aria-hidden="true">←</span> 返回資訊
        </RouterLink>
        <h1 id="radio-title">廣播</h1>
      </header>
      <ul class="radio-list">
        <li v-for="program in radioPrograms" :key="program.id">
          <a
            :href="program.url"
            class="radio-row"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`${program.title}（在新視窗開啟廣播網站）`"
          >
            <p class="radio-account-title">{{ program.title }}</p>
            <span class="external-link-icon" aria-hidden="true">↗</span>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.radio-view {
  box-sizing: border-box;
  height: calc(100vh - 49px);
  height: calc(100dvh - 49px);
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scrollbar-gutter: stable;
  padding: 16px;
  background: #fff;
}

.radio-content {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
}

.radio-header {
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

.radio-header h1 {
  margin-top: 8px;
  color: #24484e;
  font-size: 24px;
  font-weight: 700;
}

.radio-list li {
  border-bottom: 1px solid #e3e7e9;
}

.radio-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 88px;
  padding: 20px 8px;
  color: #475259;
}

.radio-row:hover {
  background: #edf8fa;
}

.radio-account-title {
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

.radio-view:focus-visible,
.radio-row:focus-visible,
.back-link:focus-visible {
  outline: 2px solid #2eb6c7;
  outline-offset: -2px;
}
</style>
