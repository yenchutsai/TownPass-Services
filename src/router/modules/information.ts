import type { RouteRecordRaw } from 'vue-router';

const informationRoutes: RouteRecordRaw[] = [
  {
    path: 'information',
    name: 'information',
    component: () => import('@/views/InformationView.vue'),
    meta: { title: '資訊' },
    children: [
      {
        path: 'phone',
        name: 'phone',
        component: () => import('@/views/infopage/PhoneView.vue'),
        meta: { title: '電話' }
      }
    ]
  }
];

export default informationRoutes;
