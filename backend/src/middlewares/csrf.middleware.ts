import { doubleCsrf } from 'csrf-csrf';
import { ExtractJwt } from 'passport-jwt';
import config from '#config/index';

const secure = config.env !== 'development';
const jwtFromHeader = ExtractJwt.fromAuthHeaderAsBearerToken();

const { doubleCsrfProtection } = doubleCsrf({
  getSecret: () => config.csrf.secret,
  getSessionIdentifier: (req) => {
    if (!req.sessionId) {
      throw new Error('Session ID is not set for the request.');
    }

    return req.sessionId;
  },
  cookieName: secure ? '__Host-x-csrf-token' : 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    secure,
  },
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'],
  skipCsrfProtection: (req) => {
    if (req.isUnauthenticated()) {
      return true;
    }

    // Only skip for Bearer token auth — non-browser clients can't be CSRF-attacked
    return jwtFromHeader(req) !== null;
  },
});

export const csrfProtection = doubleCsrfProtection;
