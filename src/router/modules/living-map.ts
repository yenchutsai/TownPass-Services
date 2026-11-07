import type { RouteRecordRaw } from 'vue-router';

const livingMapRoutes: RouteRecordRaw[] = [
  {
    path: 'living-map',
    name: 'living-map',
    component: () => import('@/views/LivingMapView.vue'),
    meta: { title: '生活地圖', titleKey: 'common.livingMap' }
  }
];

export default livingMapRoutes;
