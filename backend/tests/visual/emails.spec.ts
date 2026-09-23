import { test, expect } from '@playwright/test';
import { MailRenderer } from '#core/mail/mail.renderer';
import { fixtures } from './fixtures';

// Deterministic stand-in for i18next — only `email:footer.sentTo` is called
// by the renderer itself (every other string already comes pre-translated in
// each fixture's `context`, matching what the real mailables produce).
const tg = (key: string, vars?: Record<string, unknown>) => {
  if (key === 'email:footer.sentTo') {
    const envelope = vars?.envelope as { to: string } | undefined;
    return `This email was sent to ${envelope?.to}`;
  }
  return key;
};

for (const fixture of fixtures) {
  test(`${fixture.template} email renders unchanged`, async ({ page }) => {
    const renderer = new MailRenderer(tg);

    const html = await renderer.renderFile({
      template: fixture.template,
      envelope: { to: 'jane@example.com', subject: fixture.subject },
      context: fixture.context,
    });

    await page.setContent(html, { waitUntil: 'load' });

    await expect(page).toHaveScreenshot(`${fixture.template}.png`, {
      fullPage: true,
    });
  });
}
