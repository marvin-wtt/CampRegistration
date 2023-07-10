import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/IndexPage.vue') }],
  },
  {
    path: '/login',
    component: () => import('layouts/AuthenticationLayout.vue'),
    children: [
      {
        name: 'login',
        path: '',
        component: () => import('pages/LoginPage.vue'),
      },
    ],
  },
  {
    path: '/register',
    component: () => import('layouts/AuthenticationLayout.vue'),
    children: [
      {
        name: 'register',
        path: '/register',
        component: () => import('pages/RegisterPage.vue'),
      },
    ],
  },
  {
    path: '/forgot-password',
    component: () => import('layouts/AuthenticationLayout.vue'),
    children: [
      {
        name: 'forgot-password',
        path: '',
        component: () => import('pages/ForgotPassword.vue'),
      },
    ],
  },
  {
    path: '/reset-password',
    component: () => import('layouts/AuthenticationLayout.vue'),
    children: [
      {
        name: 'reset-password',
        path: '',
        component: () => import('pages/ResetPassword.vue'),
      },
    ],
  },
  {
    path: '/camp-management',
    component: () => import('layouts/CampManagementLayout.vue'),
    meta: {
      auth: true,
    },
    children: [
      {
        path: '',
        name: 'camp-management',
        meta: {
          hideDrawer: true,
        },
        component: () =>
          import('pages/campManagement/CampManagementIndexPage.vue'),
      },
      {
        path: 'create',
        name: 'create-camp',
        meta: {
          hideDrawer: true,
        },
        component: () => import('pages/campManagement/CreateCampPage.vue'),
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
            component: () => import('pages/campManagement/EditCampPage.vue'),
          },
          {
            path: 'dashboard',
            name: 'dashboard',
            component: () => import('pages/campManagement/DashboardPage.vue'),
          },
          {
            path: 'participants',
            name: 'participants',
            component: () =>
              import('pages/campManagement/ParticipantsIndexPage.vue'),
          },
          {
            path: 'program-planner',
            name: 'program-planner',
            component: () => import('pages/campManagement/ProgramPlanner.vue'),
          },
          {
            path: 'room-planner',
            name: 'room-planner',
            component: () => import('pages/campManagement/RoomPlanner.vue'),
          },
          {
            path: 'tools',
            name: 'tools',
            component: () => import('pages/campManagement/ToolsPage.vue'),
          },
          {
            path: 'expenses',
            name: 'expenses',
            component: () => import('pages/campManagement/ExpensesPage.vue'),
          },
          {
            path: 'access',
            name: 'access',
            component: () => import('pages/campManagement/AccessPage.vue'),
          },
          {
            path: 'settings',
            name: 'settings',
            component: () => import('pages/campManagement/SettingsPage.vue'),
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
