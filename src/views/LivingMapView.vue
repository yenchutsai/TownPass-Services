<script setup lang="ts">
import { onErrorCaptured, ref, watch } from 'vue';
import TaipeiMap from '@/components/organisms/TaipeiMap.vue';
import placeListJson from '../../public/mock/place_list.json';
import muslimFriendlyPlacesJson from '@/data/muslim-friendly-places.json';
import muslimPrayerRoomsJson from '@/data/muslim-prayer-rooms.json';
import type { LivingMapInfo, LivingMapSpot } from '@/interfaces/living-map.interface';

interface ValueFieldConfig {
  title: string;
  value_field: string;
}

interface ServiceInfoConfig {
  title: string;
  value_field?: string;
  value_fields?: ValueFieldConfig[];
}

interface PlaceConfig {
  id: string;
  name: string;
  agency: string;
  request_url: string;
  data_path: string;
  format_fields: {
    id: string;
    name: string;
    area: string;
    address: string;
    lat: string;
    lng: string;
  };
  service_infos?: ServiceInfoConfig[];
}

interface ServiceGroup {
  name: string;
  featured?: boolean;
  services: { id: string; name: string; agency: string }[];
}

interface MuslimFriendlyPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  url: string;
}

interface MuslimPrayerRoom {
  id: string;
  name: string;
  address: string;
  locationDetail: string;
  lat: number;
  lng: number;
  phone: string;
  note: string;
  sourceTitle: string;
  sourceUrl: string;
}

const placeCategories = placeListJson.list as unknown as {
  name: string;
  places: PlaceConfig[];
}[];
const placeConfigs = placeCategories.flatMap((category) => category.places);
const muslimFriendlyPlaces = muslimFriendlyPlacesJson as MuslimFriendlyPlace[];
const muslimPrayerRooms = muslimPrayerRoomsJson as MuslimPrayerRoom[];

const serviceGroups: ServiceGroup[] = [
  {
    name: '穆斯林友善',
    featured: true,
    services: [
      {
        id: 'muslim-prayer-room',
        name: '穆斯林祈禱室',
        agency: '臺北市政府觀光傳播局／各場館'
      },
      {
        id: 'muslim-friendly',
        name: '穆斯林友善店家',
        agency: '臺北市政府產業發展局商業處'
      }
    ]
  },
  ...placeCategories.map((category) => ({
    name: category.name,
    services: category.places.map(({ id, name, agency }) => ({ id, name, agency }))
  }))
];

const mapFailed = ref(false);
const selectedServiceId = ref('muslim-prayer-room');
const spots = ref<LivingMapSpot[]>([]);
const selectedSpot = ref<LivingMapSpot | null>(null);
const spotCache = new Map<string, LivingMapSpot[]>();
let latestLoadRequest = 0;

function getNestedValue(source: unknown, path: string): unknown {
  if (!path) return source;

  return path
    .replaceAll('?.', '.')
    .split('.')
    .reduce<unknown>((current, segment) => {
      if (current == null) return undefined;
      const arrayMatch = segment.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const collection = (current as Record<string, unknown>)[arrayMatch[1]];
        return Array.isArray(collection) ? collection[Number(arrayMatch[2])] : undefined;
      }
      return (current as Record<string, unknown>)[segment];
    }, source);
}

function stringifyValue(value: unknown) {
  if (value == null || value === '') return '';
  return typeof value === 'string' ? value : String(value);
}

function mapServiceInfo(item: unknown, configs: ServiceInfoConfig[] = []): LivingMapInfo[] {
  return configs.flatMap((config) => {
    if (config.value_fields) {
      return config.value_fields
        .map((field) => ({
          label: `${config.title}－${field.title}`,
          value: stringifyValue(getNestedValue(item, field.value_field))
        }))
        .filter((info) => info.value);
    }

    const value = stringifyValue(getNestedValue(item, config.value_field ?? ''));
    return value ? [{ label: config.title, value }] : [];
  });
}

function mapConfiguredSpot(item: unknown, config: PlaceConfig, index: number): LivingMapSpot {
  const fields = config.format_fields;
  return {
    id: `${config.id}-${stringifyValue(getNestedValue(item, fields.id)) || index}`,
    name: stringifyValue(getNestedValue(item, fields.name)) || '未命名地點',
    area: stringifyValue(getNestedValue(item, fields.area)),
    address: stringifyValue(getNestedValue(item, fields.address)),
    lat: Number(getNestedValue(item, fields.lat)),
    lng: Number(getNestedValue(item, fields.lng)),
    categoryId: config.id,
    categoryName: config.name,
    info: mapServiceInfo(item, config.service_infos)
  };
}

function buildMuslimFriendlySpots(): LivingMapSpot[] {
  return muslimFriendlyPlaces.map((place) => ({
    id: place.id,
    name: place.name,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    categoryId: 'muslim-friendly',
    categoryName: '穆斯林友善店家',
    info: [
      { label: '友善項目', value: '穆斯林友善' },
      ...(place.phone ? [{ label: '電話', value: place.phone }] : []),
      { label: '資料來源', value: '臺北市友善店家清冊', url: place.url }
    ]
  }));
}

function buildMuslimPrayerRoomSpots(): LivingMapSpot[] {
  return muslimPrayerRooms.map((place) => ({
    id: place.id,
    name: place.name,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    categoryId: 'muslim-prayer-room',
    categoryName: '穆斯林祈禱室',
    info: [
      { label: '位置', value: place.locationDetail },
      ...(place.phone ? [{ label: '電話', value: place.phone }] : []),
      { label: '使用提醒', value: place.note },
      { label: '資料來源', value: place.sourceTitle, url: place.sourceUrl }
    ]
  }));
}

async function loadSelectedService() {
  const serviceId = selectedServiceId.value;
  const loadRequest = ++latestLoadRequest;
  selectedSpot.value = null;

  try {
    const cached = spotCache.get(serviceId);
    if (cached) {
      if (loadRequest === latestLoadRequest) spots.value = cached;
      return;
    }

    if (serviceId === 'muslim-prayer-room' || serviceId === 'muslim-friendly') {
      const result =
        serviceId === 'muslim-prayer-room'
          ? buildMuslimPrayerRoomSpots()
          : buildMuslimFriendlySpots();
      spotCache.set(serviceId, result);
      if (loadRequest === latestLoadRequest) spots.value = result;
      return;
    }

    const config = placeConfigs.find((place) => place.id === serviceId);
    if (!config) throw new Error('找不到服務設定');

    const response = await fetch(config.request_url);
    if (!response.ok) throw new Error(`資料來源回應 ${response.status}`);
    const responseData: unknown = await response.json();
    const targetData = config.data_path
      ? getNestedValue(responseData, config.data_path)
      : responseData;
    if (!Array.isArray(targetData)) throw new Error('地點資料格式不正確');

    const result = targetData
      .map((item, index) => mapConfiguredSpot(item, config, index))
      .filter(
        (spot) =>
          Number.isFinite(spot.lat) &&
          Number.isFinite(spot.lng) &&
          spot.lat >= 24.8 &&
          spot.lat <= 25.3 &&
          spot.lng >= 121.3 &&
          spot.lng <= 121.8
      );

    spotCache.set(serviceId, result);
    if (loadRequest === latestLoadRequest) spots.value = result;
  } catch (error) {
    if (loadRequest !== latestLoadRequest) return;
    console.error('Unable to load living map places:', error);
    spots.value = [];
  }
}

function selectSpot(spot: LivingMapSpot) {
  selectedSpot.value = spot;
}

watch(selectedServiceId, loadSelectedService, { immediate: true });

onErrorCaptured((error) => {
  mapFailed.value = true;
  console.error('Unable to render the living map:', error);
  return false;
});
</script>

<template>
  <section class="living-map-view" aria-label="生活地圖">
    <header class="map-toolbar">
      <label class="service-label" for="living-map-service">服務類型</label>
      <select id="living-map-service" v-model="selectedServiceId" class="service-select">
        <optgroup v-for="group in serviceGroups" :key="group.name" :label="group.name">
          <option v-for="service in group.services" :key="service.id" :value="service.id">
            {{ service.name }}
          </option>
        </optgroup>
      </select>
    </header>

    <div class="map-column">
      <div v-if="mapFailed" class="map-error" role="alert">
        <p>地圖暫時無法載入</p>
        <button type="button" @click="mapFailed = false">重新載入地圖</button>
      </div>
      <TaipeiMap
        v-else
        :spots="spots"
        :selected-spot-id="selectedSpot?.id"
        @select-spot="selectSpot"
      />
    </div>
  </section>
</template>

<style scoped>
.living-map-view {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  min-height: calc(100dvh - 49px);
  background: #f5f8f8;
}
.place-panel {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 24px 20px;
  border-right: 1px solid #d6e1e3;
  background: #fff;
}
.panel-heading {
  margin-bottom: 20px;
}
.panel-eyebrow,
.panel-heading h1,
.result-heading p,
.muslim-group-note p,
.detail-category,
.spot-detail h2,
.detail-address {
  margin: 0;
}
.panel-eyebrow {
  color: #2a8f9b;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
}
.panel-heading h1 {
  margin-top: 4px;
  color: #24484e;
  font-size: 22px;
}
.service-label {
  margin-bottom: 7px;
  color: #475259;
  font-size: 14px;
  font-weight: 700;
}
.service-select {
  width: 100%;
  min-height: 46px;
  padding: 10px 12px;
  border: 1px solid #adb8be;
  border-radius: 9px;
  background: #fff;
  color: #24484e;
  font-size: 15px;
}
.muslim-group-note {
  display: flex;
  gap: 12px;
  margin-top: 14px;
  padding: 13px;
  border: 1px solid #d9cff0;
  border-radius: 10px;
  background: #f7f3ff;
  color: #4f3b78;
}
.muslim-group-icon {
  font-size: 22px;
}
.muslim-group-note p {
  margin-top: 4px;
  color: #66567f;
  font-size: 12px;
  line-height: 1.5;
}
.result-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e3e7e9;
  color: #24484e;
}
.result-heading p {
  margin-top: 3px;
  color: #75848c;
  font-size: 11px;
}
.result-heading > span {
  flex: 0 0 auto;
  padding: 3px 8px;
  border-radius: 999px;
  background: #e7f6f7;
  color: #247781;
  font-size: 12px;
}
.spot-list {
  min-height: 0;
  margin-top: 4px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.spot-list li {
  border-bottom: 1px solid #edf0f1;
}
.spot-list-button {
  width: 100%;
  padding: 13px 8px;
  border-left: 3px solid transparent;
  text-align: left;
}
.spot-list-button:hover,
.spot-list-button--active {
  border-left-color: #2eb6c7;
  background: #edf8fa;
}
.spot-list-button strong,
.spot-list-button span {
  display: block;
}
.spot-list-button strong {
  color: #2f4e54;
  font-size: 14px;
}
.spot-list-button span {
  margin-top: 5px;
  color: #75848c;
  font-size: 12px;
  line-height: 1.4;
}
.load-message {
  padding: 28px 8px;
  color: #75848c;
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
}
.map-column {
  position: relative;
  min-width: 0;
  padding: 20px;
}
.map-column :deep(.maplibre-map) {
  height: calc(100dvh - 158px);
  min-height: 460px;
}
.spot-detail {
  position: absolute;
  right: 38px;
  bottom: 38px;
  z-index: 500;
  width: min(390px, calc(100% - 76px));
  max-height: 48%;
  padding: 20px;
  overflow-y: auto;
  border: 1px solid #d6e1e3;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 35px rgb(36 72 78 / 18%);
}
.detail-close {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: #64757d;
  font-size: 24px;
  line-height: 1;
}
.detail-close:hover {
  background: #edf3f4;
}
.detail-category {
  padding-right: 36px;
  color: #2a8f9b;
  font-size: 12px;
  font-weight: 700;
}
.spot-detail h2 {
  margin-top: 5px;
  padding-right: 36px;
  color: #24484e;
  font-size: 20px;
}
.detail-address {
  margin-top: 9px;
  color: #586970;
  font-size: 13px;
  line-height: 1.55;
}
.detail-info {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 8px 12px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #e3e7e9;
  font-size: 13px;
}
.detail-info dt {
  color: #75848c;
}
.detail-info dd {
  min-width: 0;
  margin: 0;
  color: #354f55;
  overflow-wrap: anywhere;
}
.detail-info a {
  color: #087c8d;
  text-decoration: underline;
}
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
.service-select:focus-visible,
.spot-list-button:focus-visible,
.detail-close:focus-visible,
.map-error button:focus-visible {
  outline: 3px solid #2eb6c7;
  outline-offset: 2px;
}
@media (max-width: 760px) {
  .living-map-view {
    display: block;
  }
  .place-panel {
    padding: 18px 16px 10px;
    border-right: 0;
    border-bottom: 1px solid #d6e1e3;
  }
  .panel-heading {
    margin-bottom: 14px;
  }
  .panel-heading h1 {
    font-size: 20px;
  }
  .spot-list {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    padding-bottom: 8px;
    overflow-x: auto;
  }
  .spot-list li {
    flex: 0 0 230px;
    border: 1px solid #e3e7e9;
    border-radius: 8px;
  }
  .spot-list-button {
    height: 100%;
    border-left: 0;
    border-bottom: 3px solid transparent;
  }
  .spot-list-button:hover,
  .spot-list-button--active {
    border-bottom-color: #2eb6c7;
  }
  .map-column {
    padding: 14px;
  }
  .map-column :deep(.maplibre-map) {
    height: 60dvh;
    min-height: 400px;
  }
  .spot-detail {
    position: fixed;
    right: 12px;
    bottom: 12px;
    left: 12px;
    width: auto;
    max-height: 42dvh;
  }
}

/* The living map is intentionally reduced to one compact filter and the map. */
.living-map-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}
.map-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #d6e1e3;
  border-radius: 12px;
  background: #fff;
}
.service-label {
  flex: 0 0 auto;
  margin: 0;
}
.service-select {
  width: min(360px, 100%);
  min-height: 44px;
}
.map-column {
  flex: 1;
  min-height: 0;
  padding: 0;
}
.map-column :deep(.taipei-map) {
  max-width: none;
  height: 100%;
  padding: 0;
}
.map-column :deep(.map-heading) {
  display: none;
}
.map-column :deep(.map-canvas) {
  height: calc(100dvh - 148px);
  min-height: 520px;
}

@media (max-width: 760px) {
  .living-map-view {
    display: flex;
    gap: 10px;
    padding: 10px;
  }
  .map-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    padding: 10px;
  }
  .service-select {
    width: 100%;
  }
  .map-column {
    padding: 0;
  }
  .map-column :deep(.map-canvas) {
    height: calc(100dvh - 180px);
    min-height: 430px;
  }
}
</style>
