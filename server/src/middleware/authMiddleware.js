import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError } from '../utils/validators.js';

export const COOKIE_NAME = 'spaceguard_token';

export function cookieOptions(config) {
  return {
    httpOnly: true,
    secure: config.isProduction,
    // Local dev: Vite proxies /api so requests are same-site. Production cross-site hosting needs SameSite=None + Secure.
    sameSite: config.isProduction ? 'none' : 'lax',
    path: '/',
  };
}

export function signToken(user, config) {
  return jwt.sign({ sub: String(user._id) }, config.jwtSecret, { expiresIn: '7d', algorithm: 'HS256' });
}

export function requireAuth(config) {
  return async (req, res, next) => {
    try {
      const token = req.cookies?.[COOKIE_NAME];
      if (!token) throw new HttpError(401, 'Authentication required.', 'UNAUTHENTICATED');
      let payload;
      try {
        payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
      } catch {
        throw new HttpError(401, 'Session expired. Sign in again.', 'UNAUTHENTICATED');
      }
      const user = await User.findById(payload.sub);
      if (!user) throw new HttpError(401, 'Authentication required.', 'UNAUTHENTICATED');
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// CSRF defence for cookie auth: state-changing requests must come from an allowed origin
// (when the browser sends one) and be sent as JSON, which cross-site forms cannot do.
export function csrfGuard(config) {
  return (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.get('origin');
    if (origin) {
      const clean = origin.replace(/\/$/, '');
      const host = req.get('x-forwarded-host') || req.get('host');
      const isSameHost = host && (clean === `https://${host}` || clean === `http://${host}`);
      const isAllowedVercel = config.isVercel && /^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.vercel\.app$/.test(clean);
      if (!config.clientUrls.includes(clean) && !isSameHost && !isAllowedVercel) {
        return next(new HttpError(403, 'Origin not allowed.', 'CSRF_BLOCKED'));
      }
    }
    if (req.get('content-length') !== '0' && req.get('content-length') !== undefined && !req.is('application/json'))
      return next(new HttpError(415, 'Content-Type must be application/json.', 'UNSUPPORTED_MEDIA'));
    next();
  };
}
