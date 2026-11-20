import { describe, expect, it } from 'vitest';
import { customFileSlots } from '#app/registration/registration.helper';

describe('customFileSlots', () => {
  it('maps custom file slots to their file ids and skips form files', () => {
    expect(
      customFileSlots([
        { id: 'f1', field: 'custom:consent' },
        { id: 'f2', field: 'session-123' },
        { id: 'f3', field: null },
        { id: 'f4', field: 'custom:photo' },
      ]),
    ).toEqual({ consent: 'f1', photo: 'f4' });
  });
});
