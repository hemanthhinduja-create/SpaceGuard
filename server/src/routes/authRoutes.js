import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import dbReady from '../middleware/dbReady.js';

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export default function authRoutes(config, { authRateLimit = 20 } = {}) {
  const router = Router();
  const controller = authController(config);
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: authRateLimit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again later.' } },
  });
  router.post('/register', limiter, dbReady, wrap(controller.register));
  router.post('/login', limiter, dbReady, wrap(controller.login));
  router.get('/me', dbReady, requireAuth(config), controller.me);
  router.post('/logout', controller.logout);
  return router;
}
