import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    const payload = verifyAccessToken(token);

    if (payload.sessionStartedAt) {
      const maxSessionMs = (env.sessionMaxAgeMinutes || 30) * 60 * 1000;
      if (Date.now() - payload.sessionStartedAt > maxSessionMs) {
        throw new ApiError(401, 'Session expired, please log in again');
      }
    }

    const user = await User.findOne({ _id: payload.sub, isDeleted: { $ne: true } });

    if (!user) {
      throw new ApiError(401, 'Invalid or expired session');
    }

    if (user.isSuspended) {
      throw new ApiError(403, 'This account has been suspended');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) {
      return next(err);
    }
    next(new ApiError(401, 'Invalid or expired session'));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }
    next();
  };
}

export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (token) {
      const payload = verifyAccessToken(token);
      const user = await User.findOne({ _id: payload.sub, isDeleted: { $ne: true } });
      if (user && !user.isSuspended) {
        req.user = user;
      }
    }
    next();
  } catch (err) {
    next();
  }
}
