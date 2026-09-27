import { type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/EventLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/features/landing/pages/LandingPage.vue'),
      },
      {
        // Maintain support for legacy links
        path: 'camps/:pathMatch(.*)*',
        redirect: (to) => ({
          path: ['/events', ...(to.params.pathMatch ?? [])].join('/'),
        }),
      },
      {
        path: 'events',
        children: [
          {
            path: '',
            name: 'events',
            component: () =>
              import('@/features/publicEvents/pages/EventsListedPage.vue'),
          },
          {
            path: ':eventId',
            name: 'event',
            component: () =>
              import('@/features/publicEvents/pages/EventPage.vue'),
          },
          // A permanent address for the Art. 13 information, so the
          // confirmation mail can link to it and a registrant can come back to
          // it after submitting.
          {
            path: ':eventId/privacy',
            name: 'event.privacy',
            component: () =>
              import('@/features/publicEvents/pages/EventPrivacyPage.vue'),
            props: true,
          },
          {
            path: ':eventId/program',
            name: 'event.program',
            component: () =>
              import('@/features/program/pages/EventProgramPage.vue'),
            props: true,
          },
        ],
      },
      {
        path: 'imprint',
        name: 'imprint',
        component: () => import('@/features/legal/pages/LegalPage.vue'),
        props: { type: 'IMPRINT' },
      },
      {
        path: 'privacy-policy',
        name: 'privacy-policy',
        component: () => import('@/features/legal/pages/LegalPage.vue'),
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
        component: () => import('@/features/auth/pages/SetupPage.vue'),
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
        component: () => import('@/features/auth/pages/LoginPage.vue'),
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
        component: () => import('@/features/auth/pages/RegisterPage.vue'),
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
        component: () => import('@/features/auth/pages/ForgotPasswordPage.vue'),
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
        component: () => import('@/features/auth/pages/ResetPasswordPage.vue'),
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
        component: () => import('@/features/auth/pages/VerifyEmailPage.vue'),
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
        component: () => import('@/features/auth/pages/VerifyOtpPage.vue'),
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
      // CAUTION: This route needs to stay in sync with the backend metadata injector for SEO and link previews
      {
        path: 'events',
        children: [
          {
            path: '',
            component: () =>
              import('@/features/events/pages/EventManagementIndexPage.vue'),
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
                component: () =>
                  import('@/features/dashboard/pages/EventDashboardPage.vue'),
              },
              {
                path: 'participants',
                name: 'management.event.participants',
                component: () =>
                  import('@/features/participants/pages/RegistrationsPage.vue'),
              },
              {
                path: 'contact',
                name: 'management.event.contact',
                component: () =>
                  import('@/features/messages/pages/ContactPage.vue'),
              },
              {
                path: 'program-planner',
                name: 'management.event.program-planner',
                component: () =>
                  import('@/features/program/pages/ProgramPlannerPage.vue'),
              },
              {
                path: 'room-planner',
                name: 'management.event.room-planner',
                component: () =>
                  import('@/features/rooms/pages/RoomPlannerPage.vue'),
              },
              {
                path: 'tasks',
                name: 'management.event.tasks',
                component: () => import('@/features/tasks/pages/TasksPage.vue'),
              },
              {
                path: 'chore-planner',
                name: 'management.event.chore-planner',
                component: () =>
                  import('@/features/chores/pages/ChorePlannerPage.vue'),
              },
              {
                path: 'settings',
                children: [
                  {
                    path: '',
                    name: 'management.event.settings',
                    component: () =>
                      import('@/features/eventSettings/pages/SettingsPage.vue'),
                  },
                  {
                    path: 'access',
                    name: 'management.event.settings.access',
                    component: () =>
                      import('@/features/access/pages/AccessPage.vue'),
                  },
                  {
                    path: 'edit',
                    name: 'management.event.settings.edit',
                    component: () =>
                      import('@/features/eventSettings/pages/EventEditPage.vue'),
                  },
                  {
                    path: 'emails',
                    name: 'management.event.settings.emails',
                    component: () =>
                      import('@/features/messages/pages/MessageTemplateEditPage.vue'),
                  },
                  {
                    path: 'files',
                    name: 'management.event.settings.files',
                    component: () =>
                      import('@/features/files/pages/FileSettingsPage.vue'),
                  },
                  {
                    path: 'form',
                    name: 'management.event.settings.form',
                    component: () =>
                      import('@/features/formEditor/pages/FormEditPage.vue'),
                  },
                  {
                    path: 'navigation',
                    name: 'management.event.settings.navigation',
                    component: () =>
                      import('@/features/eventSettings/pages/NavigationSettingsPage.vue'),
                  },
                  {
                    path: 'privacy',
                    name: 'management.event.settings.privacy',
                    component: () =>
                      import('@/features/privacy/pages/EventPrivacyPage.vue'),
                  },
                  {
                    path: 'audit',
                    name: 'management.event.settings.audit',
                    component: () =>
                      import('@/features/audit/pages/AuditLogPage.vue'),
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
          import('@/features/organizations/pages/OrganizationIndexPage.vue'),
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
              import('@/features/organizations/pages/OrganizationDashboardPage.vue'),
          },
          {
            path: 'events',
            name: 'management.organization.events',
            component: () =>
              import('@/features/organizations/pages/OrganizationEventsPage.vue'),
          },
          {
            path: 'newsletters',
            name: 'management.organization.newsletters',
            component: () =>
              import('@/features/organizations/pages/OrganizationNewslettersPage.vue'),
          },
          {
            path: 'members',
            name: 'management.organization.members',
            component: () =>
              import('@/features/organizations/pages/OrganizationMembersPage.vue'),
          },
          {
            path: 'privacy',
            name: 'management.organization.privacy',
            component: () =>
              import('@/features/privacy/pages/OrganizationPrivacyPage.vue'),
          },
          {
            path: 'settings',
            name: 'management.organization.settings',
            component: () =>
              import('@/features/organizations/pages/OrganizationSettingsPage.vue'),
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
        component: () =>
          import('@/features/newsletters/pages/NewsletterIndexPage.vue'),
      },
      {
        path: ':newsletterId',
        name: 'management.newsletter',
        component: () =>
          import('@/features/newsletters/pages/NewsletterPage.vue'),
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
          import('@/features/administration/pages/AdministrationDashboardPage.vue'),
      },
      {
        path: 'organizations',
        name: 'administration.organizations',
        component: () =>
          import('@/features/administration/pages/OrganizationAdminPage.vue'),
      },
      {
        path: 'events',
        name: 'administration.events',
        component: () =>
          import('@/features/administration/pages/EventAdminPage.vue'),
      },
      {
        path: 'newsletters',
        name: 'administration.newsletters',
        component: () =>
          import('@/features/administration/pages/NewsletterAdminPage.vue'),
      },
      {
        path: 'users',
        name: 'administration.users',
        component: () =>
          import('@/features/administration/pages/UserAdminPage.vue'),
      },
      {
        path: 'queues',
        name: 'administration.queues',
        component: () =>
          import('@/features/administration/pages/QueueAdminPage.vue'),
      },
      {
        path: 'legal',
        name: 'administration.legal',
        component: () =>
          import('@/features/administration/pages/LegalSettingsAdminPage.vue'),
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
        component: () =>
          import('@/features/account/pages/ProfileSettingsPage.vue'),
      },
      {
        name: 'settings.security',
        path: 'security',
        component: () =>
          import('@/features/account/pages/SecuritySettingsPage.vue'),
      },
      {
        name: 'settings.account',
        path: 'account',
        component: () =>
          import('@/features/account/pages/AccountSettingsPage.vue'),
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
          import('@/features/newsletters/pages/NewsletterUnsubscribePage.vue'),
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
        component: () =>
          import('@/features/participants/pages/PrintTablesPage.vue'),
      },
      {
        path: 'calendar',
        name: 'print.calendar',
        component: () =>
          import('@/features/program/pages/PrintCalendarPage.vue'),
      },
      {
        path: 'chores',
        name: 'print.chores',
        component: () =>
          import('@/features/chores/pages/PrintChoreRosterPage.vue'),
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
