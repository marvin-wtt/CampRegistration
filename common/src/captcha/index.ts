// Names the protected form; the backend only accepts a token solved for the
// same action.
export type CaptchaAction =
  'signup' | 'forgot-password' | 'registration' | 'feedback';

export type CaptchaDriver = 'turnstile';

export const CAPTCHA_TOKEN_HEADER = 'X-Captcha-Token';

// Served by `GET /captcha`, so the frontend always matches the backend.
export type CaptchaClientConfig =
  { driver: null } | { driver: 'turnstile'; siteKey: string };
