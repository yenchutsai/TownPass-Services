<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, MapGeoJSONFeature } from 'maplibre-gl';
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { Feature, FeatureCollection, Point, Polygon } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import districtData from '@/data/taipei-districts.json';
import type { LivingMapSpot } from '@/interfaces/living-map.interface';

maplibregl.setWorkerUrl(mapLibreWorkerUrl);

type MapLanguage = 'zh-TW' | 'en';
type DistrictProperties = { code: string; town: string };
type DistrictFeature = Feature<Polygon, DistrictProperties>;
type SpotProperties = { id: string; name: string };

const props = withDefaults(
  defineProps<{
    spots?: LivingMapSpot[];
    selectedSpotId?: string;
  }>(),
  {
    spots: () => [],
    selectedSpotId: ''
  }
);

const emit = defineEmits<{
  'select-spot': [spot: LivingMapSpot];
  'visible-spots-change': [spots: LivingMapSpot[]];
}>();

const districts = districtData as FeatureCollection<Polygon, DistrictProperties>;
const mapElement = ref<HTMLDivElement>();
const isMapReady = ref(false);
const mapError = ref('');
const locating = ref(false);
const locationMessage = ref('');
const language = ref<MapLanguage>('zh-TW');

let map: maplibregl.Map | undefined;
let locationMarker: maplibregl.Marker | undefined;
let districtLabelMarkers: maplibregl.Marker[] = [];
let clusterMarkers = new Map<number, maplibregl.Marker>();
let disposed = false;

const districtEnglishNames: Record<string, string> = {
  大安區: 'Da’an',
  文山區: 'Wenshan',
  信義區: 'Xinyi',
  萬華區: 'Wanhua',
  中正區: 'Zhongzheng',
  松山區: 'Songshan',
  大同區: 'Datong',
  中山區: 'Zhongshan',
  士林區: 'Shilin',
  北投區: 'Beitou',
  南港區: 'Nangang',
  內湖區: 'Neihu'
};

const mapBounds: [[number, number], [number, number]] = [
  [121.42, 24.92],
  [121.7, 25.23]
];
const baseMapTileUrl =
  import.meta.env.VITE_MAP_TILE_URL ?? 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png';

function validSpot(spot: LivingMapSpot) {
  return Number.isFinite(spot.lat) && Number.isFinite(spot.lng) && spot.lat !== 0 && spot.lng !== 0;
}

function spotFeatureCollection(): FeatureCollection<Point, SpotProperties> {
  return {
    type: 'FeatureCollection',
    features: props.spots.filter(validSpot).map((spot) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [spot.lng, spot.lat] },
      properties: { id: spot.id, name: spot.name }
    }))
  };
}

function polygonCentroid(feature: DistrictFeature): [number, number] {
  const ring = feature.geometry.coordinates[0];
  let twiceArea = 0;
  let x = 0;
  let y = 0;

  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[index + 1];
    const cross = x1 * y2 - x2 * y1;
    twiceArea += cross;
    x += (x1 + x2) * cross;
    y += (y1 + y2) * cross;
  }

  if (!twiceArea) return ring[0];
  return [x / (3 * twiceArea), y / (3 * twiceArea)];
}

function clearDistrictLabels() {
  districtLabelMarkers.forEach((marker) => marker.remove());
  districtLabelMarkers = [];
}

function renderDistrictLabels() {
  if (!map) return;
  clearDistrictLabels();

  districtLabelMarkers = districts.features.map((district) => {
    const label = document.createElement('span');
    label.className = 'maplibre-district-label';
    label.textContent =
      language.value === 'en'
        ? districtEnglishNames[district.properties.town] ?? district.properties.town
        : district.properties.town;
    return new maplibregl.Marker({ element: label, anchor: 'center' })
      .setLngLat(polygonCentroid(district))
      .addTo(map!);
  });
}

function clearClusterMarkers() {
  clusterMarkers.forEach((marker) => marker.remove());
  clusterMarkers.clear();
}

async function expandCluster(clusterId: number, coordinates: [number, number]) {
  if (!map) return;
  const source = map.getSource('spots') as GeoJSONSource | undefined;
  if (!source) return;
  const zoom = await source.getClusterExpansionZoom(clusterId);
  map.easeTo({ center: coordinates, zoom });
}

function renderClusterMarkers() {
  if (!map || !map.isSourceLoaded('spots')) return;
  const features = map.querySourceFeatures('spots');
  const visibleClusterIds = new Set<number>();

  features.forEach((feature: MapGeoJSONFeature) => {
    if (!feature.properties?.cluster || feature.geometry.type !== 'Point') return;
    const clusterId = Number(feature.properties.cluster_id);
    if (visibleClusterIds.has(clusterId)) return;
    visibleClusterIds.add(clusterId);

    const coordinates = feature.geometry.coordinates.slice() as [number, number];
    const existingMarker = clusterMarkers.get(clusterId);
    if (existingMarker) {
      existingMarker.setLngLat(coordinates);
      return;
    }

    const markerElement = document.createElement('button');
    markerElement.type = 'button';
    markerElement.className = 'maplibre-cluster-marker';
    markerElement.textContent = String(feature.properties.point_count_abbreviated);
    markerElement.setAttribute('aria-label', `${feature.properties.point_count} 個地點`);
    markerElement.addEventListener('click', (event) => {
      event.stopPropagation();
      void expandCluster(clusterId, coordinates);
    });
    clusterMarkers.set(
      clusterId,
      new maplibregl.Marker({ element: markerElement }).setLngLat(coordinates).addTo(map!)
    );
  });

  clusterMarkers.forEach((marker, id) => {
    if (!visibleClusterIds.has(id)) {
      marker.remove();
      clusterMarkers.delete(id);
    }
  });
}

function emitVisibleSpots() {
  if (!map) return;
  const bounds = map.getBounds();
  emit(
    'visible-spots-change',
    props.spots.filter(validSpot).filter((spot) => bounds.contains([spot.lng, spot.lat]))
  );
}

function updateSpotSource() {
  if (!map?.getSource('spots')) return;
  (map.getSource('spots') as GeoJSONSource).setData(spotFeatureCollection());
  emitVisibleSpots();
}

function updateSelectedSpotStyle() {
  if (!map?.getLayer('unclustered-spots')) return;
  const selectedId = props.selectedSpotId ?? '';
  map.setPaintProperty('unclustered-spots', 'circle-radius', [
    'case',
    ['==', ['get', 'id'], selectedId],
    10,
    7
  ]);
  map.setPaintProperty('unclustered-spots', 'circle-color', [
    'case',
    ['==', ['get', 'id'], selectedId],
    '#e5782c',
    '#2eb6c7'
  ]);
}

function focusSpot(spot: LivingMapSpot) {
  if (!map || !validSpot(spot)) return;
  map.flyTo({ center: [spot.lng, spot.lat], zoom: Math.max(map.getZoom(), 16) });
}

function setLanguage(nextLanguage: MapLanguage) {
  language.value = nextLanguage;
  renderDistrictLabels();
}

defineExpose({ focusSpot, setLanguage });

function locate() {
  locationMessage.value = '';
  if (!navigator.geolocation) {
    locationMessage.value = '此瀏覽器不支援定位。';
    return;
  }

  locating.value = true;
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      if (disposed || !map) return;
      const markerElement = document.createElement('span');
      markerElement.className = 'maplibre-location-marker';
      locationMarker?.remove();
      locationMarker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([coords.longitude, coords.latitude])
        .addTo(map);
      map.flyTo({ center: [coords.longitude, coords.latitude], zoom: 16 });
      locationMessage.value = '已顯示你目前的位置。';
      locating.value = false;
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

watch(
  () => props.spots,
  () => updateSpotSource()
);

watch(
  () => props.selectedSpotId,
  () => updateSelectedSpotStyle()
);

onMounted(() => {
  if (!mapElement.value) return;

  try {
    map = new maplibregl.Map({
      container: mapElement.value,
      style: {
        version: 8,
        sources: {
          'base-map': {
            type: 'raster',
            tiles: [baseMapTileUrl],
            tileSize: 256,
            maxzoom: 17,
            attribution:
              'Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, SRTM | Map style © <a href="https://opentopomap.org" target="_blank">OpenTopoMap</a> (CC-BY-SA)'
          }
        },
        layers: [{ id: 'base-map', type: 'raster', source: 'base-map' }]
      },
      center: [121.545, 25.08],
      zoom: 10.6,
      minZoom: 9,
      maxZoom: 19,
      maxBounds: mapBounds,
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution:
          '<a href="https://data.gov.tw/dataset/7441" target="_blank" rel="noopener noreferrer">行政區資料：國土測繪中心</a>'
      })
    );

    map.on('load', () => {
      if (!map) return;
      const firstLabelLayer = map.getStyle().layers.find((layer) => layer.type === 'symbol')?.id;
      map.addSource('districts', { type: 'geojson', data: districts });
      map.addLayer(
        {
          id: 'district-fill',
          type: 'fill',
          source: 'districts',
          paint: { 'fill-color': '#77cbd3', 'fill-opacity': 0.08 }
        },
        firstLabelLayer
      );
      map.addLayer(
        {
          id: 'district-outline',
          type: 'line',
          source: 'districts',
          paint: { 'line-color': '#2d929f', 'line-opacity': 0.7, 'line-width': 1.5 }
        },
        firstLabelLayer
      );
      map.addSource('spots', {
        type: 'geojson',
        data: spotFeatureCollection(),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 60
      });
      map.addLayer({
        id: 'cluster-spots',
        type: 'circle',
        source: 'spots',
        filter: ['has', 'point_count'],
        paint: {
          'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 30, 27],
          'circle-color': '#2eb6c7',
          'circle-opacity': 0.35,
          'circle-stroke-color': '#2eb6c7',
          'circle-stroke-width': 2
        }
      });
      map.addLayer({
        id: 'unclustered-spots',
        type: 'circle',
        source: 'spots',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 7,
          'circle-color': '#2eb6c7',
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 2
        }
      });

      map.on('click', 'unclustered-spots', (event) => {
        const id = String(event.features?.[0]?.properties?.id ?? '');
        const spot = props.spots.find((candidate) => candidate.id === id);
        if (spot) emit('select-spot', spot);
      });
      map.on('click', 'cluster-spots', (event) => {
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== 'Point') return;
        const clusterId = Number(feature.properties?.cluster_id);
        void expandCluster(clusterId, feature.geometry.coordinates.slice() as [number, number]);
      });
      map.on('mouseenter', 'cluster-spots', () => {
        if (map) map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'cluster-spots', () => {
        if (map) map.getCanvas().style.cursor = '';
      });
      map.on('mouseenter', 'unclustered-spots', () => {
        if (map) map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'unclustered-spots', () => {
        if (map) map.getCanvas().style.cursor = '';
      });
      map.on('move', renderClusterMarkers);
      map.on('moveend', emitVisibleSpots);
      map.on('data', renderClusterMarkers);
      map.once('idle', renderClusterMarkers);

      renderDistrictLabels();
      updateSelectedSpotStyle();
      emitVisibleSpots();
      mapError.value = '';
      isMapReady.value = true;
    });
    map.on('error', (event) => {
      console.warn('MapLibre reported a non-fatal map error:', event.error);
      if (!isMapReady.value) mapError.value = 'MapLibre 地圖暫時無法載入。';
    });
  } catch (error) {
    console.error('Unable to initialize the MapLibre map:', error);
    mapError.value = 'MapLibre 地圖暫時無法載入。';
  }
});

onBeforeUnmount(() => {
  disposed = true;
  clearClusterMarkers();
  clearDistrictLabels();
  locationMarker?.remove();
  map?.remove();
  map = undefined;
});
</script>

<template>
  <section class="maplibre-map" aria-label="MapLibre 生活服務地圖">
    <div ref="mapElement" class="map-canvas" role="region" aria-label="臺北市互動地圖" />

    <button
      v-if="isMapReady"
      type="button"
      class="gps"
      :disabled="locating"
      aria-label="顯示我的位置"
      :aria-busy="locating"
      @click="locate"
    >
      <img src="@/assets/images/gps.png" width="20" alt="" />
    </button>

    <p v-if="mapError" class="map-message" role="alert">{{ mapError }}</p>
    <p class="sr-only" role="status">{{ locationMessage }}</p>
  </section>
</template>

<style scoped>
.maplibre-map {
  position: relative;
  height: 100%;
  min-height: 460px;
  overflow: hidden;
  border: 1px solid #d6e1e3;
  border-radius: 16px;
  background: #edf4f3;
}
.map-canvas {
  width: 100%;
  height: 100%;
  min-height: 460px;
}
.gps {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: #fff;
  box-shadow: rgb(0 0 0 / 30%) 0 1px 4px -1px;
  cursor: pointer;
  user-select: none;
}
.gps:disabled {
  cursor: wait;
  opacity: 0.7;
}
.map-message {
  position: absolute;
  inset: 50% auto auto 50%;
  width: min(420px, calc(100% - 40px));
  padding: 18px;
  transform: translate(-50%, -50%);
  border-radius: 10px;
  background: #fff;
  color: #586970;
  box-shadow: 0 8px 30px rgb(36 72 78 / 15%);
  text-align: center;
}
:global(.maplibre-cluster-marker) {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border: 8px solid rgb(46 182 199 / 35%);
  border-radius: 50%;
  background: #fff;
  color: #238b98;
  box-shadow: 0 2px 7px rgb(0 0 0 / 15%);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
:global(.maplibre-district-label) {
  padding: 3px 6px;
  border-radius: 4px;
  background: rgb(255 255 255 / 82%);
  color: #39727a;
  box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
  font-size: 12px;
  font-weight: 700;
  pointer-events: none;
  white-space: nowrap;
}
:global(.maplibre-location-marker) {
  display: block;
  width: 18px;
  height: 18px;
  border: 3px solid #fff;
  border-radius: 50%;
  background: #4285f4;
  box-shadow: 0 1px 5px rgb(0 0 0 / 35%);
}
</style>
