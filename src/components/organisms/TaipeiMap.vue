<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import * as L from 'leaflet';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import 'leaflet/dist/leaflet.css';
import districtData from '@/data/taipei-districts.json';

type DistrictProperties = { code: string; town: string };
type DistrictFeature = Feature<Polygon, DistrictProperties>;

const districts = districtData as FeatureCollection<Polygon, DistrictProperties>;
const mapElement = ref<HTMLDivElement>();
const selectedDistrict = ref('');
const districtOptions = [...districts.features].sort((a, b) =>
  a.properties.code.localeCompare(b.properties.code)
);
const locating = ref(false);
const locationMessage = ref('');
const tileError = ref(false);
let map: L.Map | undefined;
let boundaries: L.GeoJSON | undefined;
let positionMarker: L.CircleMarker | undefined;
let resizeObserver: ResizeObserver | undefined;
let disposed = false;

const normalStyle = { color: '#2994a3', weight: 1.5, fillColor: '#2eb6c7', fillOpacity: 0.035 };
const activeStyle = { color: '#087c8d', weight: 2.5, fillColor: '#2eb6c7', fillOpacity: 0.18 };

function districtLayers() {
  const result: L.Polygon[] = [];
  boundaries?.eachLayer((layer) => result.push(layer as L.Polygon));
  return result;
}

function selectDistrict(code: string) {
  selectedDistrict.value = code;
  districtLayers().forEach((layer) => {
    const feature = (layer as L.Polygon & { feature: DistrictFeature }).feature;
    const selected = feature.properties.code === code;
    layer.setStyle(selected ? activeStyle : normalStyle);
    if (selected) {
      layer.bringToFront();
      map?.fitBounds(layer.getBounds(), { padding: [28, 28], maxZoom: 14 });
    }
  });
  if (!code && boundaries) map?.fitBounds(boundaries.getBounds(), { padding: [20, 20] });
}

function resetView() {
  locationMessage.value = '';
  selectDistrict('');
}

function isInTaipei(latitude: number, longitude: number) {
  return districts.features.some((feature) => {
    const ring = feature.geometry.coordinates[0];
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (
        yi > latitude !== yj > latitude &&
        longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi
      )
        inside = !inside;
    }
    return inside;
  });
}

function locate() {
  locationMessage.value = '';
  if (!navigator.geolocation) {
    locationMessage.value = '此瀏覽器不支援定位。';
    return;
  }
  locating.value = true;
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      if (disposed) return;
      locating.value = false;
      if (!isInTaipei(coords.latitude, coords.longitude)) {
        locationMessage.value = '你目前的位置在台北市範圍外，地圖會維持台北市視野。';
        return;
      }
      selectDistrict('');
      positionMarker?.remove();
      positionMarker = L.circleMarker([coords.latitude, coords.longitude], {
        radius: 8,
        color: '#fff',
        weight: 3,
        fillColor: '#1479e8',
        fillOpacity: 1
      })
        .addTo(map!)
        .bindTooltip('我的位置');
      map?.setView([coords.latitude, coords.longitude], 16);
      locationMessage.value = '已顯示你目前的位置。';
    },
    (error) => {
      if (disposed) return;
      locating.value = false;
      locationMessage.value =
        error.code === 1
          ? '尚未允許定位，請在瀏覽器設定中開啟位置權限。'
          : '暫時無法取得位置，請稍後再試。';
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

onMounted(() => {
  if (!mapElement.value) return;
  const cityBounds = L.geoJSON(districts).getBounds();
  map = L.map(mapElement.value, {
    zoomControl: false,
    minZoom: 10,
    maxZoom: 19,
    maxBounds: cityBounds.pad(0.2)
  });
  // Leaflet must have a view before adding and styling vector layers.
  map.fitBounds(cityBounds, { padding: [20, 20] });
  map.attributionControl.setPrefix(false);
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
  }).addTo(map);
  tiles.on('tileerror', () => {
    tileError.value = true;
  });
  tiles.on('tileload', () => {
    tileError.value = false;
  });
  boundaries = L.geoJSON(districts, {
    attribution:
      '<a href="https://data.gov.tw/dataset/7441" target="_blank" rel="noopener noreferrer">國土測繪中心</a>',
    style: () => ({ ...normalStyle }),
    onEachFeature: (feature, layer) => {
      layer.on('click', () => selectDistrict(feature.properties.code));
    }
  }).addTo(map);

  // Keep the mask below district outlines without reordering uninitialized paths.
  const maskPane = map.createPane('taipei-mask');
  maskPane.style.zIndex = '350';
  maskPane.style.pointerEvents = 'none';
  const outerRing: L.LatLngExpression[] = [
    [24.6, 121.1],
    [24.6, 122],
    [25.6, 122],
    [25.6, 121.1]
  ];
  const holes = districts.features.map((feature) =>
    feature.geometry.coordinates[0].map(([lng, lat]) => [lat, lng] as L.LatLngTuple)
  );
  L.polygon([outerRing, ...holes], {
    pane: 'taipei-mask',
    stroke: false,
    fillColor: '#e9eff0',
    fillOpacity: 0.72,
    interactive: false
  }).addTo(map);
  L.control
    .zoom({ position: 'bottomright', zoomInTitle: '放大地圖', zoomOutTitle: '縮小地圖' })
    .addTo(map);
  resetView();
  resizeObserver = new ResizeObserver(() => map?.invalidateSize());
  resizeObserver.observe(mapElement.value);
});

onBeforeUnmount(() => {
  disposed = true;
  resizeObserver?.disconnect();
  map?.remove();
  map = undefined;
});
</script>

<template>
  <section class="taipei-map" aria-labelledby="taipei-map-title">
    <header class="map-heading">
      <h1 id="taipei-map-title">生活地圖</h1>
      <select
        class="district-select"
        aria-label="選擇行政區"
        :value="selectedDistrict"
        @change="selectDistrict(($event.target as HTMLSelectElement).value)"
      >
        <option value="">台北市全區</option>
        <option
          v-for="district in districtOptions"
          :key="district.properties.code"
          :value="district.properties.code"
        >
          {{ district.properties.town }}
        </option>
      </select>
    </header>
    <div class="map-frame">
      <div
        ref="mapElement"
        class="map-canvas"
        role="region"
        aria-label="台北市互動地圖，可拖曳、縮放及點選行政區"
      />
      <button
        type="button"
        class="locate-button"
        :disabled="locating"
        :aria-busy="locating"
        :title="locationMessage || undefined"
        @click="locate"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="6.5" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22" />
        </svg>
        我的位置
      </button>
    </div>
    <p class="sr-only" role="status">{{ locationMessage }}</p>
    <p v-if="tileError" class="sr-only" role="status">底圖暫時無法載入，請確認網路連線。</p>
  </section>
</template>

<style scoped>
.taipei-map {
  max-width: 1120px;
  margin: 0 auto;
  padding: 28px 24px 20px;
  color: #24484e;
}
.map-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.taipei-map h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.district-select {
  min-height: 44px;
  min-width: 136px;
  padding: 10px 12px;
  border: 1px solid #cad1d5;
  border-radius: 8px;
  background: #fff;
  color: #24484e;
  font-size: 14px;
}
.map-frame {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border: 1px solid #d6e1e3;
  border-radius: 16px;
  background: #edf2f1;
}
.map-canvas {
  height: clamp(380px, 72dvh, 800px);
  width: 100%;
  z-index: 0;
  background: #edf2f1;
}
.locate-button {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 7px;
  background: #fff;
  color: #24484e;
  padding: 11px 14px;
  min-height: 44px;
  border: 1px solid #e3e7e9;
  border-radius: 10px;
  box-shadow: 0 2px 10px #24484e15;
  font-size: 13px;
  font-weight: 600;
}
.locate-button svg {
  width: 19px;
  height: 19px;
}
.locate-button:disabled {
  opacity: 0.65;
  cursor: wait;
}
.locate-button:focus-visible,
.district-select:focus-visible {
  outline: 3px solid #2eb6c7;
  outline-offset: 3px;
}
:deep(.leaflet-control-attribution) {
  font-size: 10px;
}
@media (max-width: 600px) {
  .taipei-map {
    padding: 22px 16px 16px;
  }
  .taipei-map h1 {
    font-size: 25px;
  }
  .map-frame {
    border-radius: 12px;
  }
  .map-canvas {
    height: max(380px, 70dvh);
  }
  .locate-button {
    top: 12px;
    right: 12px;
  }
}
</style>
