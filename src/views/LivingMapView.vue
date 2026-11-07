<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';
import TaipeiMap from '@/components/organisms/TaipeiMap.vue';

const mapFailed = ref(false);

onErrorCaptured((error) => {
  mapFailed.value = true;
  console.error('Unable to render the living map:', error);
  return false;
});
</script>

<template>
  <section aria-label="生活地圖">
    <div v-if="mapFailed" class="map-error" role="alert">
      <p>地圖暫時無法載入</p>
      <button type="button" @click="mapFailed = false">重新載入地圖</button>
    </div>
    <TaipeiMap v-else />
  </section>
</template>

<style scoped>
.map-error {
  padding: 24px;
  color: #475259;
}
.map-error button {
  margin-top: 12px;
  padding: 10px 16px;
  border: 1px solid #2eb6c7;
  border-radius: 8px;
  color: #356c77;
}
.map-error button:focus-visible {
  outline: 2px solid #2eb6c7;
  outline-offset: 3px;
}
</style>
