import bcrypt from 'bcryptjs';
import User, { publicUser } from '../models/User.js';
import { COOKIE_NAME, cookieOptions, signToken } from '../middleware/authMiddleware.js';
import { HttpError, validateLogin, validateRegistration } from '../utils/validators.js';

const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown, so timing does not reveal whether an account exists.
const DUMMY_HASH = bcrypt.hashSync('spaceguard-dummy-password', 10);
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function authController(config) {
  const setSession = (res, user) =>
    res.cookie(COOKIE_NAME, signToken(user, config), { ...cookieOptions(config), maxAge: COOKIE_MAX_AGE });

  return {
    async register(req, res) {
      const { name, email, password } = validateRegistration(req.body);
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      let user;
      try {
        user = await User.create({ name, email, passwordHash });
      } catch (error) {
        if (error.code === 11000) throw new HttpError(409, 'An account with this email already exists. Sign in instead.', 'EMAIL_TAKEN');
        throw error;
      }
      setSession(res, user);
      res.status(201).json({ user: publicUser(user) });
    },

    async login(req, res) {
      const { email, password } = validateLogin(req.body);
      const user = await User.findOne({ email }).select('+passwordHash');
      const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
      if (!user || !ok) throw new HttpError(401, 'Incorrect email or password.', 'INVALID_CREDENTIALS');
      setSession(res, user);
      res.json({ user: publicUser(user) });
    },

    me(req, res) {
      res.json({ user: publicUser(req.user) });
    },

    logout(req, res) {
      // Stateless JWT: logout clears the HTTP-only cookie (tokens are not stored server-side).
      const { maxAge, ...options } = cookieOptions(config);
      res.clearCookie(COOKIE_NAME, options);
      res.json({ ok: true });
    },
  };
}
