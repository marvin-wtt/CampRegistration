import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/IndexPage.vue') }],
  },
  {
    path: '/results',
    name: 'results',
    component: () => import('layouts/ResultLayout.vue'),
    children: [
      {
        path: '',
        name: 'results-index',
        component: () => import('pages/results/ResultsIndexPage.vue'),
      },
      {
        path: '',
        name: 'results-create',
        component: () => null,
      },
      {
        path: ':camp',
        redirect: {
          name: 'results-dashboard',
        },
        children: [
          {
            path: 'dashboard',
            name: 'results-dashboard',
            component: () => import('pages/results/DashboardPage.vue'),
          },
          {
            path: 'participants',
            name: 'results-participants',
            component: () => import('pages/results/ParticipantsIndexPage.vue'),
          },
          {
            path: 'participants/presets',
            name: 'results-participants-presets',
            component: () => import('pages/results/PresetIndexPage.vue'),
          },
          {
            path: 'room-planner',
            name: 'room-planner',
            component: () => import('pages/results/RoomPlanner.vue'),
          },
        ],
      },
    ],
  },
  {
    path: '/camps',
    component: () => import('layouts/CampLayout.vue'),
    children: [
      {
        path: '',
        name: 'camps',
        component: () => import('pages/camps/CampIndexPage.vue'),
      },
      {
        path: ':camp',
        name: 'camp',
        component: () => import('pages/camps/CampPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
