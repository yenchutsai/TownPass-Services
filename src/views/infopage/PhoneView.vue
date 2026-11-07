<script setup lang="ts">
import { RouterLink } from 'vue-router';
import phoneIcon from '@/assets/images/icon_tel.svg';

const phoneNumbers = [
  {
    number: '1955',
    description: '勞資問題、薪資工時、移工諮詢與申訴',
    // 勞動部勞動力發展署
    source: 'https://www.wda.gov.tw/News_Content.aspx?n=277&s=18960'
  },
  {
    number: '110',
    description: '警察報案、治安事件、緊急協助',
    // 內政部警政署
    source:
      'https://www.npa.gov.tw/ch/app/artwebsite/view?id=1048&module=artwebsite&serno=e3ad2889-4dee-41cf-aef8-9b9d26dc6950'
  },
  {
    number: '119',
    description: '火災報案、緊急救護、救援',
    // 內政部消防署
    source: 'https://www.nfa.gov.tw/cht/?code=list&ids=66'
  },
  {
    number: '113',
    description: '家庭暴力、性侵害、兒少保護',
    // 衛生福利部保護服務司
    source: 'https://dep.mohw.gov.tw/DOPS/fp-1183-6499-105.html'
  },
  {
    number: '1990',
    description: '外國人在臺生活、簽證與居留諮詢',
    // 內政部移民署
    source: 'https://www.immigration.gov.tw/5385/5388/7181/100924/'
  },
  {
    number: '1999',
    description: '市政諮詢、陳情、公共設施問題',
    // 臺北市政府
    source: 'https://www.gov.taipei/News_Content.aspx?n=EEC70A4186D4C828&s=55B67D9F0BA0BB8E'
  }
];
</script>

<template>
  <section class="phone-view" aria-labelledby="phone-title" tabindex="0">
    <div class="phone-content">
      <header class="phone-header">
        <RouterLink :to="{ name: 'information' }" class="back-link">
          <span aria-hidden="true">←</span> 返回資訊
        </RouterLink>
        <h1 id="phone-title">電話</h1>
      </header>
      <ul class="phone-list">
        <li v-for="phone in phoneNumbers" :key="phone.number">
          <a
            :href="`tel:${phone.number}`"
            class="phone-row"
            :aria-label="`撥打 ${phone.number}：${phone.description}`"
          >
            <p class="phone-description">
              <strong>{{ phone.number }}</strong
              >：{{ phone.description }}
            </p>
            <img :src="phoneIcon" alt="" width="24" height="24" />
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.phone-view {
  box-sizing: border-box;
  height: calc(100vh - 49px);
  height: calc(100dvh - 49px);
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scrollbar-gutter: stable;
  padding: 16px;
  background: #fff;
}

.phone-content {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
}

.phone-header {
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

.phone-header h1 {
  margin-top: 8px;
  color: #24484e;
  font-size: 24px;
  font-weight: 700;
}

.phone-list li {
  border-bottom: 1px solid #e3e7e9;
}

.phone-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 88px;
  padding: 20px 8px;
  color: #475259;
}

.phone-row:hover {
  background: #edf8fa;
}

.phone-description {
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.phone-description strong {
  color: #356c77;
  font-size: 18px;
  font-weight: 700;
}

.phone-row img {
  flex-shrink: 0;
}

.phone-view:focus-visible,
.phone-row:focus-visible,
.back-link:focus-visible {
  outline: 2px solid #2eb6c7;
  outline-offset: -2px;
}
</style>
