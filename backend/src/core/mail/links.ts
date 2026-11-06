import sanitizeHtml from 'sanitize-html';
import { LINK_SCHEMES } from '#utils/sanitize';
import { escapeHtml } from '#core/mail/templating';

// Buttons are stored as `<a data-button href="…">Label</a>` and only take their
// email markup here, so restyling them never needs a migration.

const BUTTON_TAG = 'email-button';
const BUTTON_RE = new RegExp(
  `<${BUTTON_TAG}(?: href="([^"]*)")?>([\\s\\S]*?)</${BUTTON_TAG}>`,
  'g',
);

function buttonMarkup(href: string, label: string, color: string): string {
  const background = escapeHtml(color);

  // A table cell carries the background, because Outlook ignores padding and
  // radius on an inline link.
  return (
    `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:16px 0;border-collapse:separate;">` +
    `<tr><td align="center" bgcolor="${background}" style="border-radius:6px;background:${background};">` +
    `<a href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:6px;">${label}</a>` +
    `</td></tr></table>`
  );
}

/**
 * Prepares rendered email HTML for sending: drops every link whose scheme
 * isn't allowed — values filled into a template reach `href` unchecked — and
 * expands buttons. A button left without a target is removed.
 */
export function renderEmailLinks(
  html: string,
  options: { buttonColor: string },
): string {
  const marked = sanitizeHtml(html, {
    allowedTags: false,
    allowedAttributes: false,
    allowedSchemes: LINK_SCHEMES,
    transformTags: {
      a: (tagName, attribs) => {
        if (!('data-button' in attribs)) {
          return { tagName, attribs };
        }
        const { href } = attribs;
        return { tagName: BUTTON_TAG, attribs: href ? { href } : {} };
      },
    },
  });

  return marked.replace(
    BUTTON_RE,
    (_: string, href: string | undefined, label: string) =>
      href ? buttonMarkup(href, label, options.buttonColor) : '',
  );
}
