import { type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/EventLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/pages/LandingPage.vue'),
      },
      {
        path: 'events',
        children: [
          {
            path: '',
            name: 'events',
            component: () =>
              import('@/pages/listedEvents/EventsListedPage.vue'),
          },
          {
            path: ':eventId',
            name: 'event',
            component: () => import('@/pages/listedEvents/EventPage.vue'),
          },
          // A permanent address for the Art. 13 information, so the
          // confirmation mail can link to it and a registrant can come back to
          // it after submitting.
          {
            path: ':eventId/privacy',
            name: 'event.privacy',
            component: () =>
              import('@/pages/listedEvents/EventPrivacyPage.vue'),
            props: true,
          },
        ],
      },
      {
        path: 'imprint',
        name: 'imprint',
        component: () => import('@/pages/legal/LegalPage.vue'),
        props: { type: 'IMPRINT' },
      },
      {
        path: 'privacy-policy',
        name: 'privacy-policy',
        component: () => import('@/pages/legal/LegalPage.vue'),
        props: { type: 'PRIVACY_POLICY' },
      },
    ],
  },
  {
    path: '/setup',
    component: () => import('@/layouts/AuthenticationLayout.vue'),
    children: [
      {
        name: 'setup',
        path: '',
        component: () => import('@/pages/auth/SetupPage.vue'),
      },
    ],
  },
  {
    path: '/login',
    component: () => import('@/layouts/AuthenticationLayout.vue'),
    children: [
      {
        name: 'login',
        path: '',
        component: () => import('@/pages/auth/LoginPage.vue'),
      },
    ],
  },
  {
    path: '/register',
    component: () => import('@/layouts/AuthenticationLayout.vue'),
    children: [
      {
        name: 'register',
        path: '/register',
        component: () => import('@/pages/auth/RegisterPage.vue'),
      },
    ],
  },
  {
    path: '/forgot-password',
    component: () => import('@/layouts/AuthenticationLayout.vue'),
    children: [
      {
        name: 'forgot-password',
        path: '',
        component: () => import('@/pages/auth/ForgotPasswordPage.vue'),
      },
    ],
  },
  {
    path: '/reset-password',
    component: () => import('@/layouts/AuthenticationLayout.vue'),
    children: [
      {
        name: 'reset-password',
        path: '',
        component: () => import('@/pages/auth/ResetPasswordPage.vue'),
      },
    ],
  },
  {
    path: '/verify-email',
    component: () => import('@/layouts/AuthenticationLayout.vue'),
    children: [
      {
        name: 'verify-email',
        path: '',
        component: () => import('@/pages/auth/VerifyEmailPage.vue'),
      },
    ],
  },
  {
    path: '/verify-otp',
    component: () => import('@/layouts/AuthenticationLayout.vue'),
    children: [
      {
        name: 'verify-otp',
        path: '',
        component: () => import('@/pages/auth/VerifyOtpPage.vue'),
      },
    ],
  },
  {
    path: '/management',
    component: () => import('@/layouts/EventManagementLayout.vue'),
    meta: {
      auth: true,
    },
    children: [
      {
        path: '',
        redirect: { name: 'management.events' },
      },
      {
        path: 'events',
        children: [
          {
            path: '',
            component: () =>
              import('@/pages/event/EventManagementIndexPage.vue'),
            name: 'management.events',
          },
          {
            path: ':eventId',
            name: 'management.event',
            redirect: {
              name: 'management.event.participants',
            },
            children: [
              {
                path: 'dashboard',
                name: 'management.event.dashboard',
                component: () => import('@/pages/event/EventDashboardPage.vue'),
              },
              {
                path: 'participants',
                name: 'management.event.participants',
                component: () => import('@/pages/event/RegistrationsPage.vue'),
              },
              {
                path: 'contact',
                name: 'management.event.contact',
                component: () => import('@/pages/event/ContactPage.vue'),
              },
              {
                path: 'program-planner',
                name: 'management.event.program-planner',
                component: () => import('@/pages/event/ProgramPlannerPage.vue'),
              },
              {
                path: 'room-planner',
                name: 'management.event.room-planner',
                component: () => import('@/pages/event/RoomPlannerPage.vue'),
              },
              {
                path: 'tasks',
                name: 'management.event.tasks',
                component: () => import('@/pages/event/TasksPage.vue'),
              },
              {
                path: 'chore-planner',
                name: 'management.event.chore-planner',
                component: () => import('@/pages/event/ChorePlannerPage.vue'),
              },
              {
                path: 'settings',
                children: [
                  {
                    path: '',
                    name: 'management.event.settings',
                    component: () =>
                      import('@/pages/event/settings/SettingsPage.vue'),
                  },
                  {
                    path: 'access',
                    name: 'management.event.settings.access',
                    component: () =>
                      import('@/pages/event/settings/AccessPage.vue'),
                  },
                  {
                    path: 'edit',
                    name: 'management.event.settings.edit',
                    component: () =>
                      import('@/pages/event/settings/EventEditPage.vue'),
                  },
                  {
                    path: 'emails',
                    name: 'management.event.settings.emails',
                    component: () =>
                      import('@/pages/event/settings/MessageTemplateEditPage.vue'),
                  },
                  {
                    path: 'files',
                    name: 'management.event.settings.files',
                    component: () =>
                      import('@/pages/event/settings/FileSettingsPage.vue'),
                  },
                  {
                    path: 'form',
                    name: 'management.event.settings.form',
                    component: () =>
                      import('@/pages/event/settings/FormEditPage.vue'),
                  },
                  {
                    path: 'navigation',
                    name: 'management.event.settings.navigation',
                    component: () =>
                      import('@/pages/event/settings/NavigationSettingsPage.vue'),
                  },
                  {
                    path: 'privacy',
                    name: 'management.event.settings.privacy',
                    component: () =>
                      import('@/pages/event/settings/EventPrivacyPage.vue'),
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
    path: '/management/organizations',
    component: () => import('@/layouts/OrganizationLayout.vue'),
    meta: {
      auth: true,
    },
    children: [
      {
        path: '',
        name: 'management.organizations',
        component: () =>
          import('@/pages/organization/OrganizationIndexPage.vue'),
      },
      {
        path: ':organizationId',
        name: 'management.organization',
        redirect: { name: 'management.organization.dashboard' },
        children: [
          {
            path: 'dashboard',
            name: 'management.organization.dashboard',
            component: () =>
              import('@/pages/organization/OrganizationDashboardPage.vue'),
          },
          {
            path: 'events',
            name: 'management.organization.events',
            component: () =>
              import('@/pages/organization/OrganizationEventsPage.vue'),
          },
          {
            path: 'newsletters',
            name: 'management.organization.newsletters',
            component: () =>
              import('@/pages/organization/OrganizationNewslettersPage.vue'),
          },
          {
            path: 'members',
            name: 'management.organization.members',
            component: () =>
              import('@/pages/organization/OrganizationMembersPage.vue'),
          },
          {
            path: 'privacy',
            name: 'management.organization.privacy',
            component: () =>
              import('@/pages/organization/OrganizationPrivacyPage.vue'),
          },
          {
            path: 'settings',
            name: 'management.organization.settings',
            component: () =>
              import('@/pages/organization/OrganizationSettingsPage.vue'),
          },
        ],
      },
    ],
  },
  {
    path: '/management/newsletters',
    component: () => import('@/layouts/NewsletterLayout.vue'),
    meta: {
      auth: true,
    },
    children: [
      {
        path: '',
        name: 'management.newsletters',
        component: () => import('@/pages/newsletter/NewsletterIndexPage.vue'),
      },
      {
        path: ':newsletterId',
        name: 'management.newsletter',
        component: () => import('@/pages/newsletter/NewsletterPage.vue'),
      },
    ],
  },
  {
    path: '/administration',
    component: () => import('@/layouts/AdministrationLayout.vue'),
    meta: {
      auth: true,
    },
    children: [
      {
        path: '',
        name: 'administration',
        component: () =>
          import('@/pages/administration/AdministrationDashboardPage.vue'),
      },
      {
        path: 'organizations',
        name: 'administration.organizations',
        component: () =>
          import('@/pages/administration/OrganizationAdminPage.vue'),
      },
      {
        path: 'events',
        name: 'administration.events',
        component: () => import('@/pages/administration/EventAdminPage.vue'),
      },
      {
        path: 'newsletters',
        name: 'administration.newsletters',
        component: () =>
          import('@/pages/administration/NewsletterAdminPage.vue'),
      },
      {
        path: 'users',
        name: 'administration.users',
        component: () => import('@/pages/administration/UserAdminPage.vue'),
      },
      {
        path: 'queues',
        name: 'administration.queues',
        component: () => import('@/pages/administration/QueueAdminPage.vue'),
      },
      {
        path: 'legal',
        name: 'administration.legal',
        component: () =>
          import('@/pages/administration/LegalSettingsAdminPage.vue'),
      },
    ],
  },
  {
    path: '/settings',
    name: 'settings',
    redirect: { name: 'settings.profile' },
    component: () => import('@/layouts/AccountSettingsLayout.vue'),
    meta: {
      auth: true,
    },
    children: [
      {
        name: 'settings.profile',
        path: 'profile',
        component: () => import('@/pages/settings/ProfileSettingsPage.vue'),
      },
      {
        name: 'settings.security',
        path: 'security',
        component: () => import('@/pages/settings/SecuritySettingsPage.vue'),
      },
      {
        name: 'settings.account',
        path: 'account',
        component: () => import('@/pages/settings/AccountSettingsPage.vue'),
      },
    ],
  },
  {
    path: '/newsletters/unsubscribe/:token',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      {
        path: '',
        name: 'newsletter.unsubscribe',
        component: () =>
          import('@/pages/newsletter/NewsletterUnsubscribePage.vue'),
      },
    ],
  },
  {
    path: '/print',
    component: () => import('@/layouts/PrintLayout.vue'),
    children: [
      {
        path: 'tables',
        name: 'print.tables',
        component: () => import('@/pages/print/PrintTablesPage.vue'),
      },
      {
        path: 'calendar',
        name: 'print.calendar',
        component: () => import('@/pages/print/PrintCalendarPage.vue'),
      },
    ],
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFoundPage.vue'),
  },
];

export default routes;
