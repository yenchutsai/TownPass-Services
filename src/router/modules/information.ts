import type { RouteRecordRaw } from 'vue-router';

const informationRoutes: RouteRecordRaw[] = [
  {
    path: 'information',
    name: 'information',
    component: () => import('@/views/InformationView.vue'),
    meta: { title: '資訊', titleKey: 'common.information' },
    children: [
      {
        path: 'phone',
        name: 'phone',
        component: () => import('@/views/infopage/PhoneView.vue'),
        meta: { title: '電話', titleKey: 'information.sections.phone' }
      },
      {
        path: 'line',
        name: 'line',
        component: () => import('@/views/infopage/LineView.vue'),
        meta: { title: 'LINE', titleKey: 'information.sections.line' }
      },
      {
        path: 'website',
        name: 'website',
        component: () => import('@/views/infopage/WebsiteView.vue'),
        meta: { title: '網站', titleKey: 'information.sections.website' }
      },
      {
        path: 'facebook',
        name: 'facebook',
        component: () => import('@/views/infopage/FacebookView.vue'),
        meta: { title: 'Facebook', titleKey: 'information.sections.facebook' }
      },
      {
        path: 'youtube',
        name: 'youtube',
        component: () => import('@/views/infopage/YouTubeView.vue'),
        meta: { title: 'YouTube', titleKey: 'information.sections.youtube' }
      },
      {
        path: 'radio',
        name: 'radio',
        component: () => import('@/views/infopage/RadioView.vue'),
        meta: { title: '廣播', titleKey: 'information.sections.radio' }
      }
    ]
  }
];

export default informationRoutes;
