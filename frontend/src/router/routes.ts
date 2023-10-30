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
        component: () => import('pages/auth/LoginPage.vue'),
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
        component: () => import('pages/auth/RegisterPage.vue'),
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
        component: () => import('pages/auth/ForgotPasswordPage.vue'),
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
        component: () => import('pages/auth/ResetPasswordPage.vue'),
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
            path: 'settings',
            name: 'settings',
            component: () =>
              import('pages/campManagement/settings/SettingsPage.vue'),
            children: [
              {
                path: 'access',
                name: 'access',
                component: () =>
                  import('pages/campManagement/settings/AccessPage.vue'),
              },
              {
                path: 'edit',
                name: 'edit-camp',
                component: () =>
                  import('pages/campManagement/settings/EditCampPage.vue'),
              },
              {
                path: 'files',
                name: 'edit-files',
                component: () =>
                  import('pages/campManagement/settings/FileSettingsPage.vue'),
              },
              {
                path: 'edit-form',
                name: 'edit-form',
                component: () =>
                  import('pages/campManagement/settings/FormEditPage.vue'),
              },
            ],
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
    component: () => import('pages/ErrorNotFoundPage.vue'),
  },
];

export default routes;