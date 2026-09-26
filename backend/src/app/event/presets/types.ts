import type { AppLocale } from '@camp-registration/common/locales';

export type MessageTemplateTrigger =
  | 'registration_submitted'
  | 'registration_confirmed'
  | 'registration_waitlisted'
  | 'registration_waitlist_accepted'
  | 'registration_updated'
  | 'registration_canceled';

export interface PresetMessageTemplate {
  subject: Record<AppLocale, string>;
  body: Record<AppLocale, string>;
}

export type PresetMessageTemplates = Record<
  MessageTemplateTrigger,
  PresetMessageTemplate
>;

export interface EventPreset {
  form: Record<string, unknown>;
  tableTemplates: Record<string, unknown>[];
  messageTemplates: PresetMessageTemplates;
  themes: Record<string, unknown>;
}
