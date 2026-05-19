export type CampPermission = 'camp.view' | 'camp.edit' | 'camp.delete';

export type FilePermission =
  | 'camp.files.view'
  | 'camp.files.create'
  | 'camp.files.edit'
  | 'camp.files.delete';

export type RegistrationPermission =
  | 'camp.registrations.view'
  | 'camp.registrations.edit'
  | 'camp.registrations.delete';

export type ManagerPermission =
  | 'camp.managers.view'
  | 'camp.managers.create'
  | 'camp.managers.edit'
  | 'camp.managers.delete';

export type MessagePermission =
  | 'camp.messages.view'
  | 'camp.messages.create'
  | 'camp.messages.delete';

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
  | 'camp.rooms.beds.create'
  | 'camp.rooms.beds.edit'
  | 'camp.rooms.beds.delete';

export type ProgramEventPermission =
  | 'camp.program_events.view'
  | 'camp.program_events.create'
  | 'camp.program_events.update'
  | 'camp.program_events.delete';

export type Permission =
  | CampPermission
  | FilePermission
  | RegistrationPermission
  | ManagerPermission
  | MessagePermission
  | MessageTemplatePermission
  | TableTemplatePermission
  | RoomPermission
  | BedPermission
  | ProgramEventPermission;

export type Permissions = Permission[];
