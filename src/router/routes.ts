import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/IndexPage.vue') }],
  },
  {
    name: 'login',
    path: '/login',
    component: () => import('layouts/AuthenticationLayout.vue'),
    children: [{ path: '', component: () => import('pages/LoginPage.vue') }],
  },
  {
    path: '/camp-management',
    name: 'results',
    component: () => import('layouts/CampManagementLayout.vue'),
    children: [
      {
        path: '',
        name: 'camp-management',
        meta: {
          hideDrawer: true,
        },
        component: () =>
          import('pages/camp-management/CampManagementIndexPage.vue'),
      },
      {
        path: 'create',
        name: 'create-camp',
        meta: {
          hideDrawer: true,
        },
        component: () => import('pages/camp-management/CreateCampPage.vue'),
      },
      {
        path: ':camp',
        redirect: {
          name: 'dashboard',
        },
        children: [
          {
            path: 'edit',
            name: 'edit-camp',
            component: () => import('pages/camp-management/EditCampPage.vue'),
          },
          {
            path: 'dashboard',
            name: 'dashboard',
            component: () => import('pages/camp-management/DashboardPage.vue'),
          },
          {
            path: 'participants',
            name: 'participants',
            component: () =>
              import('pages/camp-management/ParticipantsIndexPage.vue'),
          },
          {
            path: 'program-planner',
            name: 'program-planner',
            component: () => import('pages/camp-management/ProgramPlanner.vue'),
          },
          {
            path: 'room-planner',
            name: 'room-planner',
            component: () => import('pages/camp-management/RoomPlanner.vue'),
          },
          {
            path: 'tools',
            name: 'tools',
            component: () => import('pages/camp-management/ToolsPage.vue'),
          },
          {
            path: 'expenses',
            name: 'expenses',
            component: () => import('pages/camp-management/ExpensesPage.vue'),
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
