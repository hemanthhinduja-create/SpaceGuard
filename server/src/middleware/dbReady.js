import { isDbConnected } from '../config/db.js';
import { HttpError } from '../utils/validators.js';

export default function dbReady(req, res, next) {
  if (!isDbConnected()) return next(new HttpError(503, 'Database is unavailable.', 'DB_UNAVAILABLE'));
  next();
}
