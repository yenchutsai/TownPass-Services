<script setup lang="ts">
import { RouterLink } from 'vue-router';

const lineAccounts = [
  {
    id: 'zh',
    title: '1955移工專線-E-LINE-中文版',
    url: 'https://lin.ee/9ogCQ3T'
  },
  {
    id: 'id',
    title: '1955移工專線-E-LINE-印尼版 Indonesia 🇮🇩',
    url: 'https://lin.ee/CP0lzIK'
  },
  {
    id: 'vi',
    title: '1955移工專線-E-LINE-越南版 Tiếng Việt 🇻🇳',
    url: 'https://lin.ee/GOrGlZI'
  },
  {
    id: 'th',
    title: '1955移工專線-E-LINE-泰國版 ภาษาไทย 🇹🇭',
    url: 'https://lin.ee/c0fW2nc'
  },
  {
    id: 'en',
    title: '1955移工專線-E-LINE-英文版 English 菲律賓 🇵🇭',
    url: 'https://lin.ee/jap3WmC'
  }
];
</script>

<template>
  <section class="line-view" aria-labelledby="line-title" tabindex="0">
    <div class="line-content">
      <header class="line-header">
        <RouterLink :to="{ name: 'information' }" class="back-link">
          <span aria-hidden="true">←</span> 返回資訊
        </RouterLink>
        <h1 id="line-title">LINE</h1>
      </header>
      <ul class="line-list">
        <li v-for="account in lineAccounts" :key="account.id">
          <a
            :href="account.url"
            class="line-row"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`${account.title}（在新視窗開啟 LINE 連結）`"
          >
            <p class="line-account-title">{{ account.title }}</p>
            <span class="external-link-icon" aria-hidden="true">↗</span>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.line-view {
  box-sizing: border-box;
  height: calc(100vh - 49px);
  height: calc(100dvh - 49px);
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scrollbar-gutter: stable;
  padding: 16px;
  background: #fff;
}

.line-content {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
}

.line-header {
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

.line-header h1 {
  margin-top: 8px;
  color: #24484e;
  font-size: 24px;
  font-weight: 700;
}

.line-list li {
  border-bottom: 1px solid #e3e7e9;
}

.line-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 88px;
  padding: 20px 8px;
  color: #475259;
}

.line-row:hover {
  background: #edf8fa;
}

.line-account-title {
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

.line-view:focus-visible,
.line-row:focus-visible,
.back-link:focus-visible {
  outline: 2px solid #2eb6c7;
  outline-offset: -2px;
}
</style>
