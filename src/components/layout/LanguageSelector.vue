<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { currentLocale, setLocale } from '@/i18n';
import { languageOptions } from '@/i18n/config';

const { t } = useI18n({ useScope: 'global' });
const open = ref(false);
const container = ref<HTMLElement>();
const trigger = ref<HTMLButtonElement>();

function chooseLanguage(locale: string) {
  setLocale(locale);
  open.value = false;
  trigger.value?.focus();
}

function closeOnOutsideClick(event: Event) {
  if (!container.value?.contains(event.target as Node)) open.value = false;
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    open.value = false;
    trigger.value?.focus();
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', closeOnOutsideClick);
  document.addEventListener('keydown', closeOnEscape);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeOnOutsideClick);
  document.removeEventListener('keydown', closeOnEscape);
});
</script>

<template>
  <div ref="container" class="language-selector">
    <button
      ref="trigger"
      type="button"
      class="language-trigger"
      :aria-label="t('common.language')"
      :title="t('common.language')"
      :aria-expanded="open"
      aria-controls="language-options"
      @click="open = !open"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        <path d="M3 12h18M5 7h14M5 17h14" />
      </svg>
    </button>
    <div
      v-if="open"
      id="language-options"
      class="language-menu"
      role="group"
      :aria-label="t('common.language')"
    >
      <button
        v-for="option in languageOptions"
        :key="option.value"
        type="button"
        class="language-option"
        :aria-pressed="currentLocale === option.value"
        @click="chooseLanguage(option.value)"
      >
        {{ option.label }}
        <span v-if="currentLocale === option.value" aria-hidden="true">✓</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.language-selector {
  position: fixed;
  top: calc(var(--service-chrome-height, 49px) + 12px);
  right: max(16px, env(safe-area-inset-right));
  z-index: 1100;
}
.language-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 1px solid #239aaa;
  border-radius: 50%;
  background: #2eb6c7;
  color: #fff;
  box-shadow: 0 4px 16px rgb(36 72 78 / 22%);
  cursor: pointer;
}
.language-trigger svg {
  width: 27px;
  height: 27px;
}
.language-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: min(200px, calc(100vw - 32px));
  max-height: calc(100dvh - 130px);
  padding: 6px;
  overflow-y: auto;
  border: 1px solid #d6e1e3;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 28px rgb(36 72 78 / 18%);
}
.language-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border-radius: 7px;
  color: #24484e;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}
.language-option:hover,
.language-option[aria-pressed='true'] {
  background: #edf8fa;
  color: #087c8d;
}
.language-trigger:focus-visible,
.language-option:focus-visible {
  outline: 2px solid #2eb6c7;
  outline-offset: 2px;
}
</style>
