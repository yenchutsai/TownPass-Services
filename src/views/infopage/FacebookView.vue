<script setup lang="ts">
import { RouterLink } from 'vue-router';

const facebookLinks = [
  {
    id: '1955-hotline',
    title: '1955hotline移工專線',
    url: 'https://www.facebook.com/1955foreignworkershotline/'
  },
  {
    id: 'taipei-labor',
    title: '臺北市勞動力重建運用處',
    url: 'https://www.facebook.com/handinhandintaipei'
  },
  {
    id: 'kdei-taipei',
    title: 'KDEI Taipei 駐台北印尼經濟貿易代表處',
    url: 'https://www.facebook.com/KDEI.Taipei.Taiwan/'
  },
  {
    id: 'kdei-immigration',
    title: 'Imigrasi KDEI Taipei 印尼代表處移民組',
    url: 'https://www.facebook.com/imigrasi.kdeitaipei.56/'
  },
  {
    id: 'save-pmi',
    title: 'Save PMI Taiwan',
    url: 'https://savepmi.kdei-taipei.org/'
  },
  {
    id: 'veco-taipei',
    title: 'VECO Taipei 駐台北越南經濟文化辦事處',
    url: 'https://www.facebook.com/VIETNAMOFFICEINTAIPEI/'
  },
  {
    id: 'veco-labor',
    title: '越南辦事處勞工管理組',
    url: 'http://www.vecolabor.org.tw'
  },
  {
    id: 'meco',
    title: 'MECO 馬尼拉經濟文化辦事處',
    url: 'https://www.facebook.com/MECO.official/'
  },
  {
    id: 'thai-labor',
    title: '泰國駐台北勞工事務處',
    url: 'https://www.facebook.com/thailabourtaipei/'
  }
];
</script>

<template>
  <section class="facebook-view" aria-labelledby="facebook-title" tabindex="0">
    <div class="facebook-content">
      <header class="facebook-header">
        <RouterLink :to="{ name: 'information' }" class="back-link">
          <span aria-hidden="true">←</span> 返回資訊
        </RouterLink>
        <h1 id="facebook-title">Facebook</h1>
      </header>
      <ul class="facebook-list">
        <li v-for="account in facebookLinks" :key="account.id">
          <a
            :href="account.url"
            class="facebook-row"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`${account.title}（在新視窗開啟連結）`"
          >
            <p class="facebook-account-title">{{ account.title }}</p>
            <span class="external-link-icon" aria-hidden="true">↗</span>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.facebook-view {
  box-sizing: border-box;
  height: calc(100vh - 49px);
  height: calc(100dvh - 49px);
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scrollbar-gutter: stable;
  padding: 16px;
  background: #fff;
}

.facebook-content {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
}

.facebook-header {
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

.facebook-header h1 {
  margin-top: 8px;
  color: #24484e;
  font-size: 24px;
  font-weight: 700;
}

.facebook-list li {
  border-bottom: 1px solid #e3e7e9;
}

.facebook-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 88px;
  padding: 20px 8px;
  color: #475259;
}

.facebook-row:hover {
  background: #edf8fa;
}

.facebook-account-title {
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

.facebook-view:focus-visible,
.facebook-row:focus-visible,
.back-link:focus-visible {
  outline: 2px solid #2eb6c7;
  outline-offset: -2px;
}
</style>
