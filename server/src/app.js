import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { dbState } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import satelliteRoutes from './routes/satelliteRoutes.js';
import { csrfGuard } from './middleware/authMiddleware.js';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';

export function createApp(config, options = {}) {
  const app = express();
  app.disable('x-powered-by');
  if (config.isProduction) app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin / curl requests have no Origin header.
        if (!origin || config.clientUrls.includes(origin.replace(/\/$/, ''))) return callback(null, true);
        if (config.isVercel && /^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)*\.vercel\.app$/.test(origin.replace(/\/$/, '')))
          return callback(null, true);
        callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  app.use(csrfGuard(config));

  app.get('/api/health', (req, res) => {
    const database = dbState();
    res.status(database === 'connected' ? 200 : 503).json({
      status: database === 'connected' ? 'ok' : 'degraded',
      database,
      time: new Date().toISOString(),
    });
  });
  app.use('/api/auth', authRoutes(config, options));
  app.use('/api/satellites', satelliteRoutes(config));
  app.use(notFound);
  app.use(errorHandler(config));
  return app;
}
