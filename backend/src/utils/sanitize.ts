import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  's',
  'mark',
  'code',
  'pre',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'span',
  'div',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'hr',
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height'],
  '*': ['style', 'class'],
};

// sanitize-html strips all style content unless allowedStyles is explicitly set.
// These are the CSS properties produced by TipTap's formatting extensions.
const COLOR_RE = [
  /^#[0-9a-f]{3,8}$/i,
  /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i,
  /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)$/i,
];

const ALLOWED_STYLES: sanitizeHtml.IOptions['allowedStyles'] = {
  '*': {
    color: COLOR_RE,
    'background-color': COLOR_RE,
    'text-align': [/^(left|right|center|justify)$/],
    'font-size': [/^\d+(\.\d+)?(px|em|rem|%|pt)$/],
    'font-weight': [/^(bold|normal|[1-9]00)$/],
    'font-style': [/^(italic|normal|oblique)$/],
    'text-decoration': [/^(underline|line-through|none|overline)(\s+(underline|line-through|none|overline))*$/],
  },
};

const ALLOWED_SCHEMES = ['http', 'https', 'mailto', 'tel'];

export function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedStyles: ALLOWED_STYLES,
    allowedSchemes: ALLOWED_SCHEMES,
    allowedSchemesByTag: {
      a: ALLOWED_SCHEMES,
      img: ['http', 'https'],
    },
  });
}
