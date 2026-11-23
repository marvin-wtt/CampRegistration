import type { Registration } from '@camp-registration/common/entities';

type RegistrationStatus = Registration['status'];

/** A submission's lifecycle as the form's status card shows it. */
export type SubmitState =
  | 'saving'
  | 'success'
  | 'error'
  | 'priceChanged'
  | 'consentChanged'
  | 'consentMissing';

/** What the card offers to recover: a fresh page, the answers, another try. */
export type SubmitAction = 'reload' | 'edit' | 'retry';

export interface SubmitStatusView {
  /** The i18n key holding its `title` and `text`. */
  key: string;
  /** The MD3 color role of its badge. */
  color: 'primary' | 'positive' | 'info' | 'warning' | 'error';
  /** Absent while saving, which shows a spinner. */
  icon?: string;
  action?: {
    kind: SubmitAction;
    icon: string;
    label: string;
    test: string;
  };
}

// A page loaded before the price or a consent changed can't be fixed in
// place: the person starts over on a freshly loaded one.
const RELOAD = {
  kind: 'reload',
  icon: 'refresh',
  label: 'submit.priceChanged.reload',
  test: 'registration-price-reload',
} as const;

const VIEWS: Record<Exclude<SubmitState, 'success'>, SubmitStatusView> = {
  saving: { key: 'submit.saving', color: 'primary' },
  error: {
    key: 'submit.error',
    color: 'error',
    icon: 'error',
    action: {
      kind: 'retry',
      icon: 'refresh',
      label: 'submit.error.retry',
      test: 'registration-submit-retry',
    },
  },
  priceChanged: {
    key: 'submit.priceChanged',
    color: 'warning',
    icon: 'price_change',
    action: RELOAD,
  },
  consentChanged: {
    key: 'submit.consentChanged',
    color: 'warning',
    icon: 'edit_note',
    action: RELOAD,
  },
  consentMissing: {
    key: 'submit.consentMissing',
    color: 'warning',
    icon: 'warning',
    action: {
      kind: 'edit',
      icon: 'edit',
      label: 'submit.consentMissing.edit',
      test: 'registration-consent-edit',
    },
  },
};

// A success reads as what happens to the registration next.
const SUCCESS_VIEWS: Partial<Record<RegistrationStatus, SubmitStatusView>> = {
  PENDING: { key: 'complete.pending', color: 'info', icon: 'schedule' },
  WAITLISTED: {
    key: 'complete.waitlisted',
    color: 'warning',
    icon: 'hourglass_top',
  },
};

const SUCCESS: SubmitStatusView = {
  key: 'complete',
  color: 'positive',
  icon: 'check_circle',
};

export function submitStatusView(
  state: SubmitState,
  status?: RegistrationStatus,
): SubmitStatusView {
  if (state !== 'success') {
    return VIEWS[state];
  }

  return (status && SUCCESS_VIEWS[status]) ?? SUCCESS;
}
