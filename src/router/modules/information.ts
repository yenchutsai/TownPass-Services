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
      },
      {
        path: 'line',
        name: 'line',
        component: () => import('@/views/infopage/LineView.vue'),
        meta: { title: 'LINE' }
      },
      {
        path: 'website',
        name: 'website',
        component: () => import('@/views/infopage/WebsiteView.vue'),
        meta: { title: '網站' }
      },
      {
        path: 'facebook',
        name: 'facebook',
        component: () => import('@/views/infopage/FacebookView.vue'),
        meta: { title: 'Facebook' }
      }
    ]
  }
];

export default informationRoutes;
