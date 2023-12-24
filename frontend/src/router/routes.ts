import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/CampLayout.vue'),
    children: [
      {
        // Same as /camps
        path: '',
        component: () => import('pages/camps/CampIndexPage.vue'),
      },
      {
        path: 'camps',
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
    ],
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
    path: '/management',
    component: () => import('layouts/CampManagementLayout.vue'),
    meta: {
      auth: true,
    },
    children: [
      {
        path: '',
        name: 'management',
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
            path: 'participants',
            name: 'participants',
            component: () =>
              import('pages/campManagement/ParticipantsIndexPage.vue'),
          },
          {
            path: 'room-planner',
            name: 'room-planner',
            component: () => import('pages/campManagement/RoomPlannerPage.vue'),
          },
          {
            path: 'tools',
            name: 'tools',
            component: () => import('pages/campManagement/ToolsPage.vue'),
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
              {
                path: 'notification',
                name: 'notification',
                component: () =>
                  import(
                    'pages/campManagement/settings/NotificationEditorPage.vue'
                  ),
              },
            ],
          },
        ],
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
