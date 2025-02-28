import { type RouteRecordRaw } from 'vue-router';

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
    path: '/verify-email',
    component: () => import('layouts/AuthenticationLayout.vue'),
    children: [
      {
        name: 'verify-email',
        path: '',
        component: () => import('pages/auth/VerifyEmailPage.vue'),
      },
    ],
  },
  {
    path: '/verify-otp',
    component: () => import('layouts/AuthenticationLayout.vue'),
    children: [
      {
        name: 'verify-otp',
        path: '',
        component: () => import('pages/auth/VerifyOtpPage.vue'),
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
        path: ':camp',
        redirect: {
          name: 'dashboard',
        },
        children: [
          {
            path: 'dashboard',
            name: 'dashboard',
            redirect: {
              name: 'participants',
            },
          },
          {
            path: 'participants',
            name: 'participants',
            component: () =>
              import('pages/campManagement/ParticipantsIndexPage.vue'),
          },
          {
            path: 'contact',
            name: 'management.camp.contact',
            component: () => import('pages/campManagement/ContactPage.vue'),
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
            name: 'management.settings',
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
                path: 'emails',
                name: 'edit-email-templates',
                component: () =>
                  import(
                    'pages/campManagement/settings/EmailTemplateEditPage.vue'
                  ),
              },
              {
                path: 'files',
                name: 'edit-files',
                component: () =>
                  import('pages/campManagement/settings/FileSettingsPage.vue'),
              },
              {
                path: 'form',
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
    path: '/administration',
    component: () => import('layouts/AdministrationLayout.vue'),
    meta: {
      auth: true,
    },
    children: [
      {
        path: '',
        name: 'administration',
        meta: {
          hideDrawer: true,
        },
        component: () =>
          import('pages/administration/AdministrationIndexPage.vue'),
      },
      {
        path: 'camps',
        name: 'administration.camps',
        component: () => import('pages/administration/CampIndexPage.vue'),
      },
      {
        path: 'users',
        name: 'administration.users',
        component: () => import('pages/administration/UserIndexPage.vue'),
      },
    ],
  },
  {
    path: '/settings',
    component: () => import('layouts/CampManagementLayout.vue'),
    meta: {
      auth: true,
      hideDrawer: true,
    },
    children: [
      {
        path: '',
        component: () => import('pages/settings/SettingsPage.vue'),
        children: [
          {
            path: 'account',
            component: () => import('pages/settings/AccountSettingsPage.vue'),
          },
          {
            name: 'settings',
            path: 'profile',
            component: () => import('pages/settings/ProfileSettingsPage.vue'),
          },
          {
            path: 'security',
            component: () => import('pages/settings/SecuritySettingsPage.vue'),
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
