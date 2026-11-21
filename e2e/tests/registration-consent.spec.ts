import { test, expect } from '../support/fixtures';

// Seeded by backend/prisma/seeders/e2e/event.seeder.ts.
const CONSENT_FILE_EVENT = '01JHP0CXJFR4MQS8SF1HQJCF01';

test.describe('registration consent', () => {
  // The server compares the consent wording the browser showed with its own
  // rendering. A link to an event file ({_file.rules}) is written by the
  // browser's text processing, which only a real browser runs.
  test('should accept a consent whose wording links an event file', async ({
    page,
  }) => {
    await page.goto(`/events/${CONSENT_FILE_EVENT}/`);

    const registrationForm = page.getByTestId('registration-form');
    await registrationForm
      .locator('[data-name=first_name]')
      .locator('input')
      .fill('Tom');
    await registrationForm
      .locator('[data-name=consent_rules]')
      .locator('input[type=checkbox]')
      .check({ force: true });

    const createRegistrationResponse = page.waitForResponse(
      (resp) =>
        resp
          .url()
          .includes(`/api/v1/events/${CONSENT_FILE_EVENT}/registrations`) &&
        resp.request().method() === 'POST',
    );
    await registrationForm.locator('.sd-navigation__complete-btn').click();
    const response = await createRegistrationResponse;

    expect(response.status()).toBe(201);

    const displayed = (
      response.request().postDataJSON() as {
        displayedConsents: Record<string, string>;
      }
    ).displayedConsents;
    const { data } = (await response.json()) as {
      data: { consentTexts: Record<string, string> };
    };

    // Stored as shown, link included.
    expect(data.consentTexts).toEqual(displayed);
    expect(data.consentTexts.consent_rules).toContain(
      `](/api/v1/events/${CONSENT_FILE_EVENT}/files/slots/rules/`,
    );
  });
});
