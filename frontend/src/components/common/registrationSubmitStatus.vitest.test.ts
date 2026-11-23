import { describe, expect, it } from 'vitest';
import { submitStatusView } from './registrationSubmitStatus';

describe('submitStatusView', () => {
  it('shows a spinner, no icon, while saving', () => {
    expect(submitStatusView('saving')).toEqual({
      key: 'submit.saving',
      color: 'primary',
    });
  });

  it('reads a success as what happens to the registration next', () => {
    expect(submitStatusView('success', 'ACCEPTED')).toMatchObject({
      key: 'complete',
      color: 'positive',
    });
    expect(submitStatusView('success', 'PENDING')).toMatchObject({
      key: 'complete.pending',
      color: 'info',
    });
    expect(submitStatusView('success', 'WAITLISTED')).toMatchObject({
      key: 'complete.waitlisted',
      color: 'warning',
    });
    expect(submitStatusView('success')).toMatchObject({ key: 'complete' });
  });

  it('offers a way out of every refusal', () => {
    expect(submitStatusView('error').action?.kind).toBe('retry');
    expect(submitStatusView('priceChanged').action?.kind).toBe('reload');
    expect(submitStatusView('consentChanged').action?.kind).toBe('reload');
    expect(submitStatusView('consentMissing').action?.kind).toBe('edit');
  });

  it('gives a warning a warning icon', () => {
    expect(submitStatusView('consentMissing')).toMatchObject({
      color: 'warning',
      icon: 'warning',
    });
  });
});
