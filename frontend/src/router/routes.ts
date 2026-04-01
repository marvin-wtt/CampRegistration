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
        redirect: {
          name: 'management.camps',
        },
      },
      {
        path: 'newsletters',
        meta: {
          hideDrawer: true,
        },
        children: [
          {
            path: '',
            name: 'management.newsletters',
            component: () => import('pages/newsletter/NewsletterIndexPage.vue'),
          },
          {
            path: ':newsletterId',
            name: 'management.newsletter',
            component: () => import('pages/newsletter/NewsletterPage.vue'),
          },
        ],
      },
      {
        path: 'camps',
        children: [
          {
            path: '',
            component: () =>
              import('pages/campManagement/CampManagementIndexPage.vue'),
            name: 'management.camps',
            meta: {
              hideDrawer: true,
            },
          },
          {
            path: ':campId',
            name: 'management.camp',
            redirect: {
              name: 'management.camp.participants',
            },
            children: [
              {
                path: 'participants',
                name: 'management.camp.participants',
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
                name: 'management.camp.room-planner',
                component: () =>
                  import('pages/campManagement/RoomPlannerPage.vue'),
              },
              {
                path: 'settings',
                name: 'management.camp.settings',
                component: () =>
                  import('pages/campManagement/settings/SettingsPage.vue'),
                children: [
                  {
                    path: 'access',
                    name: 'management.camp.settings.access',
                    component: () =>
                      import('pages/campManagement/settings/AccessPage.vue'),
                  },
                  {
                    path: 'edit',
                    name: 'management.camp.settings.edit',
                    component: () =>
                      import('pages/campManagement/settings/EditCampPage.vue'),
                  },
                  {
                    path: 'emails',
                    name: 'management.camp.settings.emails',
                    component: () =>
                      import('pages/campManagement/settings/MessageTemplateEditPage.vue'),
                  },
                  {
                    path: 'files',
                    name: 'management.camp.settings.files',
                    component: () =>
                      import('pages/campManagement/settings/FileSettingsPage.vue'),
                  },
                  {
                    path: 'form',
                    name: 'management.camp.settings.form',
                    component: () =>
                      import('pages/campManagement/settings/FormEditPage.vue'),
                  },
                ],
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
        path: 'newsletters',
        name: 'administration.newsletters',
        component: () => import('pages/administration/NewsletterIndexPage.vue'),
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
  {
    path: '/newsletters/unsubscribe/:token',
    component: () => import('layouts/AuthenticationLayout.vue'),
    children: [
      {
        path: '',
        name: 'newsletter.unsubscribe',
        component: () =>
          import('pages/newsletter/NewsletterUnsubscribePage.vue'),
      },
    ],
  },
  {
    path: '/print',
    component: () => import('layouts/PrintLayout.vue'),
    children: [
      {
        path: 'tables',
        name: 'print.tables',
        component: () => import('pages/print/PrintTablesPage.vue'),
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
