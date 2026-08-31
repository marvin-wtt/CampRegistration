export type EventPermission = 'event.view' | 'event.edit' | 'event.delete';

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
  | 'event.program_items.update'
  | 'event.program_items.delete';

export type TaskPermission =
  | 'event.tasks.view'
  | 'event.tasks.create'
  | 'event.tasks.update'
  | 'event.tasks.delete';

export type DutyPermission =
  | 'event.duties.view'
  | 'event.duties.create'
  | 'event.duties.edit'
  | 'event.duties.delete';

export type DutyAssignmentPermission =
  | 'event.duty_assignments.view'
  | 'event.duty_assignments.create'
  | 'event.duty_assignments.edit'
  | 'event.duty_assignments.delete';

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
  | DutyPermission
  | DutyAssignmentPermission;

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
 * The complete, fixed event permission set an organization OWNER/ADMIN holds on
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
