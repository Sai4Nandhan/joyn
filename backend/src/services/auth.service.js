import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, signResetToken, verifyResetToken } from '../utils/jwt.js';
import { env } from '../config/env.js';

import { escapeRegex } from '../utils/sanitize.js';
import { evaluateAccountLinkage } from './accountLink.service.js';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshExpiryDate() {
  const days = parseInt(env.jwt.refreshExpiresIn, 10) || 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function issueTokenPair(user, meta = {}, existingSessionStartedAt = null) {
  const sessionStartedAt = existingSessionStartedAt || Date.now();
  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role, sessionStartedAt });
  const refreshToken = signRefreshToken({ sub: user._id.toString(), sessionStartedAt });

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiryDate(),
    sessionStartedAt: new Date(sessionStartedAt),
    userAgent: meta.userAgent,
    ip: meta.ip,
  });

  return { accessToken, refreshToken };
}

import { sendOtp, verifyOtp, normalizeTarget } from './otp.service.js';

export async function register({ name, email, phone, verificationMethod = 'email', password, otp }, meta) {
  const trimmedName = (name || '').trim();
  if (!trimmedName || trimmedName.length < 2) {
    throw new ApiError(400, 'Name must be at least 2 characters long');
  }

  const method = verificationMethod === 'phone' ? 'phone' : 'email';
  const target = normalizeTarget(method, email, phone);

  // Check for unique name
  const safeName = escapeRegex(trimmedName);
  const existingName = await User.findOne({
    name: { $regex: `^${safeName}$`, $options: 'i' },
    isDeleted: { $ne: true },
  });
  if (existingName) {
    throw new ApiError(409, 'A member with this name already exists. Please choose a unique display name.');
  }

  // Check unique email or phone
  if (method === 'email') {
    const existingEmail = await User.findOne({ email: target, isDeleted: { $ne: true } });
    if (existingEmail) {
      throw new ApiError(409, 'An account with this email address already exists');
    }
  } else {
    const existingPhone = await User.findOne({ phone: target, isDeleted: { $ne: true } });
    if (existingPhone) {
      throw new ApiError(409, 'An account with this phone number already exists');
    }
  }

  // Verify OTP code
  await verifyOtp({ method, email: target, phone: target, target, otp, purpose: method === 'email' ? 'EMAIL_VERIFICATION' : 'PHONE_VERIFICATION' });

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name: trimmedName,
    email: method === 'email' ? target : (email || `${target}@phone.joynapp.com`).toLowerCase().trim(),
    phone: method === 'phone' ? target : (phone || null),
    verificationMethod: method,
    isEmailVerified: method === 'email',
    isPhoneVerified: method === 'phone',
    passwordHash,
  });

  await evaluateAccountLinkage(user);

  const tokens = await issueTokenPair(user, meta);
  return { user, ...tokens };
}

export async function login({ email, password }, meta) {
  const rawInput = (email || '').trim();
  const normalizedEmail = rawInput.toLowerCase();
  const rawPhone = rawInput.replace(/[\s\-\(\)]/g, '');
  const isPhone = /^\+?[0-9]{10,15}$/.test(rawPhone);

  const query = isPhone
    ? {
        $or: [
          { phone: rawPhone },
          { email: `${rawPhone}@phone.joynapp.com` },
          { email: normalizedEmail },
        ],
        isDeleted: { $ne: true },
      }
    : { email: normalizedEmail, isDeleted: { $ne: true } };

  const user = await User.findOne(query).select('+passwordHash');

  // Timing-safe: always run a bcrypt compare to prevent timing attacks that
  // reveal whether an email exists based on response speed.
  const DUMMY_HASH = '$2b$12$invalidhashfortimingneutrality000000000000000000000000000';
  const passwordValid = user
    ? await user.comparePassword(password)
    : await bcrypt.compare(password, DUMMY_HASH).catch(() => false);

  if (env.nodeEnv === 'development') {
    console.log('[AUTH DIAGNOSTIC]', {
      emailNormalized: true,
      userFound: Boolean(user),
      passwordHashExists: Boolean(user && user.passwordHash),
      passwordMatch: Boolean(passwordValid),
      isSuspended: Boolean(user && user.isSuspended),
      result: !user ? 'ACCOUNT_NOT_FOUND' : !passwordValid ? 'INVALID_CREDENTIALS' : user.isSuspended ? 'SUSPENDED' : 'SUCCESS',
    });
  }

  if (!user) {
    throw new ApiError(401, 'No account found with this email or phone number. Please sign up first.', null, 'account_not_found');
  }

  if (!passwordValid) {
    throw new ApiError(401, 'Incorrect email or password.', null, 'invalid_credentials');
  }

  if (user.isSuspended) {
    throw new ApiError(403, 'Your account has been suspended. Please contact support.');
  }

  const tokens = await issueTokenPair(user, meta);
  return { user, ...tokens };
}

export async function forgotPassword({ contact, method = 'email' }) {
  const m = method.toLowerCase() === 'phone' ? 'phone' : 'email';
  let target;
  try {
    target = normalizeTarget(m, m === 'email' ? contact : null, m === 'phone' ? contact : null);
  } catch {
    // Return generic message for invalid target syntax to prevent account enumeration
    return {
      success: true,
      message: 'If an account is associated with that contact, a verification code has been sent.',
    };
  }

  // Find user by registered contact
  const query = m === 'email'
    ? { email: target, isDeleted: { $ne: true } }
    : { phone: target, isDeleted: { $ne: true } };

  const user = await User.findOne(query);

  // ACCOUNT ENUMERATION PROTECTION:
  // If user does not exist, return generic success message without sending OTP
  if (!user) {
    return {
      success: true,
      message: 'If an account is associated with that contact, a verification code has been sent.',
      method: m,
    };
  }

  // Ensure contact is verified for password reset
  if (m === 'email' && !user.isEmailVerified) {
    return {
      success: true,
      message: 'If an account is associated with that contact, a verification code has been sent.',
      method: m,
    };
  }
  if (m === 'phone' && !user.isPhoneVerified) {
    return {
      success: true,
      message: 'If an account is associated with that contact, a verification code has been sent.',
      method: m,
    };
  }

  // Dispatch OTP with purpose PASSWORD_RESET
  await sendOtp({
    verificationMethod: m,
    method: m,
    target,
    purpose: 'PASSWORD_RESET',
  });

  return {
    success: true,
    message: 'If an account is associated with that contact, a verification code has been sent.',
    method: m,
  };
}

export async function verifyResetOtp({ contact, method = 'email', otp }) {
  const m = method.toLowerCase() === 'phone' ? 'phone' : 'email';
  const target = normalizeTarget(m, m === 'email' ? contact : null, m === 'phone' ? contact : null);

  // Find user
  const query = m === 'email'
    ? { email: target, isDeleted: { $ne: true } }
    : { phone: target, isDeleted: { $ne: true } };

  const user = await User.findOne(query);
  if (!user) {
    throw new ApiError(400, 'Invalid contact or verification code');
  }

  // Verify OTP for purpose PASSWORD_RESET
  await verifyOtp({
    verificationMethod: m,
    method: m,
    target,
    otp,
    purpose: 'PASSWORD_RESET',
  });

  // Generate short-lived reset token (15 mins)
  const resetToken = signResetToken({ userId: user._id.toString(), target, method: m });

  return {
    success: true,
    resetToken,
    message: 'Verification code verified successfully. Please set your new password.',
  };
}

export async function resetPassword({ resetToken, newPassword }) {
  let decoded;
  try {
    decoded = verifyResetToken(resetToken);
  } catch {
    throw new ApiError(400, 'Invalid or expired password reset token. Please restart password recovery.');
  }

  const user = await User.findOne({ _id: decoded.userId, isDeleted: { $ne: true } });
  if (!user) {
    throw new ApiError(400, 'Account not found');
  }

  // Hash new password
  const passwordHash = await User.hashPassword(newPassword);
  user.passwordHash = passwordHash;
  await user.save();

  // SECURITY REQUIREMENT: Revoke all existing sessions/refresh tokens for this user
  await RefreshToken.updateMany(
    { user: user._id, revokedAt: null },
    { revokedAt: new Date() }
  );

  return {
    success: true,
    message: 'Password reset successfully. You can now log in with your new password.',
  };
}

export async function refresh(oldRefreshToken, meta) {
  if (!oldRefreshToken) {
    throw new ApiError(401, 'Refresh token missing');
  }

  let payload;
  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const tokenHash = hashToken(oldRefreshToken);
  const stored = await RefreshToken.findOne({
    user: payload.sub,
    tokenHash,
    revokedAt: null,
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw new ApiError(401, 'Session expired, please log in again');
  }

  const sessionStartedAt = payload.sessionStartedAt || (stored.sessionStartedAt ? new Date(stored.sessionStartedAt).getTime() : null);

  const user = await User.findOne({ _id: payload.sub, isDeleted: { $ne: true } });
  if (!user) {
    throw new ApiError(401, 'Account not found');
  }

  if (user.isSuspended) {
    throw new ApiError(403, 'This account has been suspended');
  }

  stored.revokedAt = new Date();
  await stored.save();

  const tokens = await issueTokenPair(user, meta, sessionStartedAt);
  return { user, ...tokens };
}

export async function logout(refreshTokenValue) {
  if (!refreshTokenValue) return;
  const tokenHash = hashToken(refreshTokenValue);
  await RefreshToken.updateOne({ tokenHash }, { revokedAt: new Date() });
}
