import type { RouteRecordRaw } from 'vue-router';

const eventRoutes: RouteRecordRaw[] = [
  {
    path: 'events',
    name: 'events',
    component: () => import('@/views/EventsView.vue'),
    meta: { title: '活動', titleKey: 'common.events' }
  }
];

export default eventRoutes;
