import type { AppLocale } from '@camp-registration/common/locales';
import type {
  HideableNavigationItem,
  SETTING_KEYS,
} from '@camp-registration/common/settings';

export type MessageTemplateTrigger =
  | 'registration_submitted'
  | 'registration_confirmed'
  | 'registration_waitlisted'
  | 'registration_waitlist_accepted'
  | 'registration_updated'
  | 'registration_canceled';

export type PaymentMessageTemplateTrigger =
  | 'payment_requested'
  | 'payment_received'
  | 'payment_failed'
  | 'payment_refunded'
  | 'payment_reminder';

export interface PresetMessageTemplate {
  subject: Record<AppLocale, string>;
  body: Record<AppLocale, string>;
}

export type PresetMessageTemplates = Record<
  MessageTemplateTrigger,
  PresetMessageTemplate
>;

export type PaymentMessageTemplates = Record<
  PaymentMessageTemplateTrigger,
  PresetMessageTemplate
>;

export interface EventPreset {
  form: Record<string, unknown>;
  tableTemplates: Record<string, unknown>[];
  messageTemplates: PresetMessageTemplates;
  themes: Record<string, unknown>;
  settings?: Partial<
    Record<
      typeof SETTING_KEYS.NAVIGATION,
      { hiddenItems: HideableNavigationItem[] }
    >
  >;
}
