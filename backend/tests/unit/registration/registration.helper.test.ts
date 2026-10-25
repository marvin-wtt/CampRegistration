import { describe, expect, it } from 'vitest';
import {
  computedRegistrationData,
  customFileSlots,
} from '#app/registration/registration.helper';

describe('computedRegistrationData', () => {
  it('maps every tagged answer to its column', () => {
    expect(
      computedRegistrationData({
        first_name: ['Ann'],
        last_name: ['Lee'],
        street: ['Main Street 1'],
        city: ['Sometown'],
        zip_code: ['12345'],
        country: ['de'],
        date_of_birth: ['2014-05-03'],
        email: ['ann@example.com'],
        role: ['participant'],
        gender: ['f'],
        newsletter_consent: [true],
      }),
    ).toEqual({
      firstName: 'Ann',
      lastName: 'Lee',
      street: 'Main Street 1',
      city: 'Sometown',
      zipCode: '12345',
      country: 'de',
      dateOfBirth: '2014-05-03T00:00:00.000Z',
      emails: ['ann@example.com'],
      role: 'participant',
      gender: 'f',
      newsletterConsent: true,
    });
  });

  it('leaves every column empty without tagged answers', () => {
    expect(computedRegistrationData({})).toEqual({
      firstName: null,
      lastName: null,
      street: null,
      city: null,
      zipCode: null,
      country: null,
      dateOfBirth: null,
      emails: [],
      role: null,
      gender: null,
      newsletterConsent: null,
    });
  });

  describe('address', () => {
    const address = {
      address: 'Main Street 1',
      zip_code: '12345',
      city: 'Sometown',
      country: 'de',
    };

    it('takes the fields of an address question', () => {
      expect(computedRegistrationData({ address: [address] })).toMatchObject({
        street: 'Main Street 1',
        zipCode: '12345',
        city: 'Sometown',
        country: 'de',
      });
    });

    it('prefers questions of their own over the address question', () => {
      expect(
        computedRegistrationData({
          address: [address],
          street: ['Other Street 2'],
          city: ['Othertown'],
          zip_code: ['99999'],
          country: ['fr'],
        }),
      ).toMatchObject({
        street: 'Other Street 2',
        zipCode: '99999',
        city: 'Othertown',
        country: 'fr',
      });
    });

    it('takes the first of several address questions', () => {
      expect(
        computedRegistrationData({
          address: [address, { ...address, country: 'fr' }],
        }),
      ).toMatchObject({ country: 'de' });
    });

    it('ignores address fields of the wrong type', () => {
      expect(
        computedRegistrationData({
          address: [{ address: 1, zip_code: null, city: {}, country: ['de'] }],
        }),
      ).toMatchObject({
        street: null,
        zipCode: null,
        city: null,
        country: null,
      });
    });

    it('ignores an address answer that is no object', () => {
      expect(
        computedRegistrationData({ address: ['Main Street 1'] }),
      ).toMatchObject({ street: null, country: null });
    });
  });

  it('takes the first text answer of a tag', () => {
    expect(
      computedRegistrationData({ first_name: [null, 7, 'Ann', 'Bea'] }),
    ).toMatchObject({ firstName: 'Ann' });
  });

  it('collects every email address, skipping empty ones', () => {
    expect(
      computedRegistrationData({
        email: ['ann@example.com', '', null, 'parent@example.com'],
      }),
    ).toMatchObject({ emails: ['ann@example.com', 'parent@example.com'] });
  });

  it('records newsletter consent only when one answer agreed', () => {
    expect(
      computedRegistrationData({ newsletter_consent: [false, true] }),
    ).toMatchObject({ newsletterConsent: true });
    expect(
      computedRegistrationData({ newsletter_consent: [false, 'yes'] }),
    ).toMatchObject({ newsletterConsent: false });
  });

  // The group is chosen before the form, so the answers never decide it.
  it('derives no group', () => {
    expect(
      computedRegistrationData({
        country: ['de'],
        address: [{ country: 'fr' }],
      }),
    ).not.toHaveProperty('group');
  });
});

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
