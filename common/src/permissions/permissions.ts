export type CampPermission = 'camp.view' | 'camp.edit' | 'camp.delete';

export type FilePermission =
  | 'camp.files.view'
  | 'camp.files.create'
  | 'camp.files.edit'
  | 'camp.files.delete';

export type RegistrationPermission =
  | 'camp.registrations.view'
  | 'camp.registrations.create'
  | 'camp.registrations.edit'
  | 'camp.registrations.delete';

export type ManagerPermission =
  | 'camp.managers.view'
  | 'camp.managers.create'
  | 'camp.managers.edit'
  | 'camp.managers.delete';

export type MessagePermission =
  'camp.messages.view' | 'camp.messages.create' | 'camp.messages.delete';

export type MessageTemplatePermission =
  | 'camp.message_templates.view'
  | 'camp.message_templates.create'
  | 'camp.message_templates.edit'
  | 'camp.message_templates.delete';

export type TableTemplatePermission =
  | 'camp.table_templates.view'
  | 'camp.table_templates.create'
  | 'camp.table_templates.edit'
  | 'camp.table_templates.delete';

export type RoomPermission =
  | 'camp.rooms.view'
  | 'camp.rooms.create'
  | 'camp.rooms.edit'
  | 'camp.rooms.delete';

export type BedPermission =
  'camp.rooms.beds.create' | 'camp.rooms.beds.edit' | 'camp.rooms.beds.delete';

export type ProgramEventPermission =
  | 'camp.program_events.view'
  | 'camp.program_events.create'
  | 'camp.program_events.update'
  | 'camp.program_events.delete';

export type TaskPermission =
  | 'camp.tasks.view'
  | 'camp.tasks.create'
  | 'camp.tasks.update'
  | 'camp.tasks.delete';

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
  | 'organization.camps.view'
  | 'organization.camps.create'
  | 'organization.newsletters.create';

/**
 * Everything resolvable against a camp-manager role. Named separately from
 * {@link Permission} so camp-scoped APIs can refuse a newsletter or
 * organization string at compile time instead of silently never matching.
 */
export type CampScopedPermission =
  | CampPermission
  | FilePermission
  | RegistrationPermission
  | ManagerPermission
  | MessagePermission
  | MessageTemplatePermission
  | TableTemplatePermission
  | RoomPermission
  | BedPermission
  | ProgramEventPermission
  | TaskPermission;

export type Permission =
  CampScopedPermission | NewsletterPermission | OrganizationPermission;

export type Permissions = Permission[];

/**
 * Organization roles that carry implicit access to the organization's camps.
 * MEMBERs get nothing implicit — they must be invited as camp managers.
 */
export const ORGANIZATION_CAMP_ACCESS_ROLES = ['ADMIN'] as const;

/**
 * The complete, fixed camp permission set an organization OWNER/ADMIN holds on
 * every camp their organization owns, without any camp-manager record.
 *
 * Deliberately minimal: see that the camp exists, stop it accepting
 * registrations (`camp.edit`), and see who manages it. It must NEVER include
 * `camp.registrations.view` or any other camp permission — an organization role
 * is an ownership and accountability relationship, not a grant of access to
 * participants' personal data.
 *
 * A fixed constant rather than a registry lookup, so an organization role can
 * never widen into arbitrary camp permissions.
 */
export const ORGANIZATION_CAMP_PERMISSIONS = [
  'camp.view',
  'camp.edit',
  'camp.managers.view',
] as const satisfies readonly CampScopedPermission[];
