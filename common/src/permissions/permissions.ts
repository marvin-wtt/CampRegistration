export type EventPermission = 'event.view' | 'event.edit' | 'event.delete';

export type AuditPermission = 'event.audit.view';

export type FilePermission =
  | 'event.files.view'
  | 'event.files.create'
  | 'event.files.edit'
  | 'event.files.delete';

export type RegistrationPermission =
  | 'event.registrations.view'
  | 'event.registrations.create'
  | 'event.registrations.edit'
  | 'event.registrations.delete';

export type ManagerPermission =
  | 'event.managers.view'
  | 'event.managers.create'
  | 'event.managers.edit'
  | 'event.managers.delete';

export type MessagePermission =
  'event.messages.view' | 'event.messages.create' | 'event.messages.delete';

export type MessageTemplatePermission =
  | 'event.message_templates.view'
  | 'event.message_templates.create'
  | 'event.message_templates.edit'
  | 'event.message_templates.delete';

export type TableTemplatePermission =
  | 'event.table_templates.view'
  | 'event.table_templates.create'
  | 'event.table_templates.edit'
  | 'event.table_templates.delete';

export type RoomPermission =
  | 'event.rooms.view'
  | 'event.rooms.create'
  | 'event.rooms.edit'
  | 'event.rooms.delete';

export type BedPermission =
  | 'event.rooms.beds.create'
  | 'event.rooms.beds.edit'
  | 'event.rooms.beds.delete';

export type ProgramItemPermission =
  | 'event.program_items.view'
  | 'event.program_items.create'
  | 'event.program_items.edit'
  | 'event.program_items.delete';

export type TaskPermission =
  | 'event.tasks.view'
  | 'event.tasks.create'
  | 'event.tasks.edit'
  | 'event.tasks.delete';

export type ChorePermission =
  | 'event.chores.view'
  | 'event.chores.create'
  | 'event.chores.edit'
  | 'event.chores.delete';

export type ChoreAssignmentPermission =
  | 'event.chore_assignments.view'
  | 'event.chore_assignments.create'
  | 'event.chore_assignments.edit'
  | 'event.chore_assignments.delete';

export type ExpensePermission =
  | 'event.expenses.view'
  | 'event.expenses.create'
  | 'event.expenses.edit'
  | 'event.expenses.delete';

export type PayoutPermission =
  | 'event.payouts.view'
  | 'event.payouts.create'
  | 'event.payouts.edit'
  | 'event.payouts.sign'
  | 'event.payouts.delete';

export type FinancePermission = 'event.finances.configure';

/** Seeing income goes with `event.expenses.view`; these record it. */
export type IncomePermission =
  'event.income.create' | 'event.income.edit' | 'event.income.delete';

export type PaymentPermission =
  | 'event.payments.view'
  | 'event.payments.create'
  | 'event.payments.refund'
  | 'event.payments.adjust';

export type NewsletterPermission =
  | 'newsletter.view'
  | 'newsletter.edit'
  | 'newsletter.delete'
  | 'newsletter.managers.view'
  | 'newsletter.managers.create'
  | 'newsletter.managers.delete'
  | 'newsletter.subscribers.view'
  | 'newsletter.subscribers.create'
  | 'newsletter.subscribers.delete'
  | 'newsletter.messages.view'
  | 'newsletter.messages.create'
  | 'newsletter.messages.delete';

export type OrganizationPermission =
  | 'organization.view'
  | 'organization.edit'
  | 'organization.delete'
  | 'organization.members.view'
  | 'organization.members.create'
  | 'organization.members.edit'
  | 'organization.members.delete'
  | 'organization.events.view'
  | 'organization.events.create'
  | 'organization.newsletters.view'
  | 'organization.newsletters.create';

/**
 * Everything resolvable against an event-manager role. Named separately from
 * {@link Permission} so event-scoped APIs can refuse a newsletter or
 * organization string at compile time instead of silently never matching.
 */
export type EventScopedPermission =
  | EventPermission
  | AuditPermission
  | FilePermission
  | RegistrationPermission
  | ManagerPermission
  | MessagePermission
  | MessageTemplatePermission
  | TableTemplatePermission
  | RoomPermission
  | BedPermission
  | ProgramItemPermission
  | TaskPermission
  | ChorePermission
  | ChoreAssignmentPermission
  | ExpensePermission
  | PayoutPermission
  | FinancePermission
  | IncomePermission
  | PaymentPermission;

export type Permission =
  EventScopedPermission | NewsletterPermission | OrganizationPermission;

export type Permissions = Permission[];

/**
 * Organization roles that carry implicit access to the organization's events and
 * newsletters. MEMBERs get nothing implicit — they must be invited as event or
 * newsletter managers.
 */
export const ORGANIZATION_EVENT_ACCESS_ROLES = ['ADMIN'] as const;

/**
 * The complete, fixed event permission set an organization ADMIN holds on
 * every event their organization owns, without any event-manager record.
 *
 * Deliberately minimal: see that the event exists, stop it accepting
 * registrations (`event.edit`), and see who manages it. It must NEVER include
 * `event.registrations.view` or any other event permission — an organization role
 * is an ownership and accountability relationship, not a grant of access to
 * participants' personal data.
 *
 * A fixed constant rather than a registry lookup, so an organization role can
 * never widen into arbitrary event permissions.
 */
export const ORGANIZATION_EVENT_PERMISSIONS = [
  'event.view',
  'event.edit',
  'event.managers.view',
] as const satisfies readonly EventScopedPermission[];

/**
 * What a new event copies from its reference event, each part with the
 * permissions it takes on the reference. The backend's clone is typed against
 * these keys, so copying a part without declaring its permissions won't compile.
 * `settings` must cover every setting key's view permission (tested).
 */
export const EVENT_COPY_PERMISSIONS = {
  form: ['event.view'],
  themes: ['event.view'],
  privacyNotice: ['event.view'],
  files: ['event.files.view'],
  tableTemplates: ['event.table_templates.view'],
  messageTemplates: ['event.message_templates.view'],
  settings: ['event.view', 'event.rooms.view', 'event.program_items.view'],
  financeCategories: ['event.finances.configure'],
  financePrefixes: ['event.finances.configure'],
} as const satisfies Record<string, readonly EventScopedPermission[]>;

export type EventCopyPart = keyof typeof EVENT_COPY_PERMISSIONS;

/** Every permission copying an event takes: all parts are copied or none. */
export const EVENT_COPY_REQUIRED_PERMISSIONS: readonly EventScopedPermission[] =
  [...new Set(Object.values(EVENT_COPY_PERMISSIONS).flat())];

/**
 * The newsletter counterpart of `ORGANIZATION_EVENT_PERMISSIONS`: what an
 * organization ADMIN holds on every newsletter their organization owns, without
 * any newsletter-manager record.
 *
 * Deliberately minimal, and narrower than the event set: see that the newsletter
 * exists and see who runs it. It must NEVER include
 * `newsletter.subscribers.view` — the subscriber list is personal data, the
 * newsletter equivalent of an event's registrations — nor
 * `newsletter.messages.*`, which would let an owner read or send the
 * organization's mail without ever being made a manager.
 */
export const ORGANIZATION_NEWSLETTER_PERMISSIONS = [
  'newsletter.view',
  'newsletter.managers.view',
] as const satisfies readonly NewsletterPermission[];
