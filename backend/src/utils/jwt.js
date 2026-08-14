import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

export function signResetToken(payload) {
  return jwt.sign({ ...payload, purpose: 'PASSWORD_RESET' }, env.jwt.accessSecret, {
    expiresIn: '15m',
  });
}

export function verifyResetToken(token) {
  const decoded = jwt.verify(token, env.jwt.accessSecret);
  if (decoded.purpose !== 'PASSWORD_RESET') {
    throw new Error('Invalid reset token purpose');
  }
  return decoded;
}
