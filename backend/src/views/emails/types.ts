/**
 * Prop contracts for the top-level email templates. Imported by both the
 * `.vue` component (`defineProps<T>()`) and the mailable that renders it
 * (`context: {...} satisfies LocalContext<T>`), so a dropped or mistyped
 * field is a compile error on the mailable side instead of a silent blank in
 * the sent email.
 */

/** Injected centrally by `MailRenderer.renderFile` — never set by a mailable. */
export interface BaseEmailProps {
  subject: string;
  appName: string;
  primaryColor: string;
  sentTo: string;
}

/** What a mailable's `content().context` must satisfy for template `T`. */
export type LocalContext<T> = Omit<T, keyof BaseEmailProps>;

export interface DefaultEmailProps extends BaseEmailProps {
  preview: string;
  body: string;
  reason?: string;
}

/**
 * Fields shared by every "action card" email — a heading, body copy, a
 * single CTA button, and a sign-off. A template with nothing beyond this
 * (manager-invitation, organization-review-pending, organization-verified)
 * uses `ActionCardProps` directly; one that needs more declares its own
 * interface `extend`ing it (never a `type X = Y` alias of another
 * template's name) so a field added for one template can never silently
 * change another's contract.
 */
export interface ActionCardProps extends BaseEmailProps {
  preview: string;
  reason: string;
  title: string;
  information: string;
  button: string;
  greeting: string;
  teamName: string;
  url: string;
}

export interface MessageBouncedProps extends ActionCardProps {
  eventName: string;
}

export interface FeedbackProps extends BaseEmailProps {
  preview: string;
  reason: string;
  title: string;
  replyNote: string;
  messageLabel: string;
  locationLabel: string;
  userAgentLabel: string;
  message: string;
  location?: string;
  userAgent?: string;
}

export interface VerifyEmailProps extends ActionCardProps {
  accidental: string;
}

export interface ResetPasswordProps extends ActionCardProps {
  accidental: string;
}

export interface OrganizationRejectedProps extends ActionCardProps {
  reasonLabel: string;
  reviewNote?: string;
}

export interface EventRetentionDueProps extends ActionCardProps {
  action: string;
  hasExceptions: boolean;
  exceptions: string;
  hasConsentBoundData: boolean;
  consentBound: string;
  noAutomaticDeletion: string;
}

export interface RegistrationManagerNotificationProps extends ActionCardProps {
  eventName: string;
}

export interface NewsletterProps extends BaseEmailProps {
  preview: string;
  body: string;
  reason: string;
  unsubscribeUrl: string;
  unsubscribeLabel: string;
}

export interface RegistrationMessageProps extends BaseEmailProps {
  preview: string;
  eventName: string;
  body: string;
  reason?: string;
  privacyUrl?: string;
  privacyLabel?: string;
}
