<script setup lang="ts">
import { RouterLink } from 'vue-router';

const websites = [
  {
    id: 'worker-rights',
    title: '外國人勞動權益網',
    url: 'https://fw.wda.gov.tw'
  },
  {
    id: 'worker-query',
    title: '勞保局移工線上查詢系統',
    url: 'https://fwad.wda.gov.tw/fwad/'
  },
  {
    id: 'taipei-new-immigrants',
    title: '臺北市新住民網站',
    url: 'https://nit.taipei/'
  },
  {
    id: 'occupational-safety',
    title: '職業安全衛生數位學習平台',
    url: 'https://isafeel.osha.gov.tw/'
  },
  {
    id: 'kdei',
    title: 'KDEI Taipei 印尼代表處',
    url: 'https://www.kdei-taipei.org'
  },
  {
    id: 'save-pmi',
    title: 'Save PMI Taiwan',
    url: 'https://savepmi.kdei-taipei.org/'
  },
  {
    id: 'veco-labor',
    title: '越南辦事處勞工管理組',
    url: 'http://www.vecolabor.org.tw'
  },
  {
    id: 'vietnam-office',
    title: '越南辦事處',
    url: 'https://vnoffice-taipei.mofa.gov.vn'
  },
  {
    id: 'thai-labor',
    title: '泰國駐台北勞工事務處',
    url: 'https://taipei.mol.go.th?utm_source=chatgpt.com'
  },
  {
    id: 'meco',
    title: 'MECO 菲律賓辦事處',
    url: 'https://www.meco.org.tw'
  },
  {
    id: 'dmw',
    title: 'DMW 菲律賓移工部',
    url: 'https://dmw.gov.ph'
  }
];
</script>

<template>
  <section class="website-view" aria-labelledby="website-title" tabindex="0">
    <div class="website-content">
      <header class="website-header">
        <RouterLink :to="{ name: 'information' }" class="back-link">
          <span aria-hidden="true">←</span> 返回資訊
        </RouterLink>
        <h1 id="website-title">網站</h1>
      </header>
      <ul class="website-list">
        <li v-for="website in websites" :key="website.id">
          <a
            :href="website.url"
            class="website-row"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`${website.title}（在新視窗開啟網站）`"
          >
            <p class="website-account-title">{{ website.title }}</p>
            <span class="external-link-icon" aria-hidden="true">↗</span>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.website-view {
  box-sizing: border-box;
  height: calc(100vh - 49px);
  height: calc(100dvh - 49px);
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scrollbar-gutter: stable;
  padding: 16px;
  background: #fff;
}

.website-content {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
}

.website-header {
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

.website-header h1 {
  margin-top: 8px;
  color: #24484e;
  font-size: 24px;
  font-weight: 700;
}

.website-list li {
  border-bottom: 1px solid #e3e7e9;
}

.website-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 88px;
  padding: 20px 8px;
  color: #475259;
}

.website-row:hover {
  background: #edf8fa;
}

.website-account-title {
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

.website-view:focus-visible,
.website-row:focus-visible,
.back-link:focus-visible {
  outline: 2px solid #2eb6c7;
  outline-offset: -2px;
}
</style>
