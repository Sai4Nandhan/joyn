import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Otp } from '../models/Otp.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSmsOtp, sendEmailOtp } from './messaging.service.js';

export function normalizeTarget(method, email, phone) {
  if (method === 'email') {
    const norm = (email || '').trim().toLowerCase();
    if (!norm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm)) {
      throw new ApiError(400, 'Please enter a valid email address');
    }
    return norm;
  } else if (method === 'phone') {
    const raw = (phone || '').replace(/[\s\-\(\)]/g, '');
    if (!raw || !/^\+?[0-9]{10,15}$/.test(raw)) {
      throw new ApiError(400, 'Please enter a valid 10+ digit mobile phone number (e.g. +91 9876543210)');
    }
    return raw;
  }
  throw new ApiError(400, 'Invalid verification method. Select Email or Phone');
}

export async function sendOtp({ verificationMethod, method, email, phone, target: directTarget, purpose = 'EMAIL_VERIFICATION' }) {
  const m = (verificationMethod || method || (email ? 'email' : 'phone')).toLowerCase();
  const target = directTarget || normalizeTarget(m, email, phone);
  const otpPurpose = purpose.toUpperCase();

  // For registration verification purposes, check for existing account
  if (otpPurpose !== 'PASSWORD_RESET') {
    if (m === 'email') {
      const existing = await User.findOne({ email: target, isDeleted: { $ne: true } });
      if (existing) {
        throw new ApiError(409, 'An account with this email address already exists');
      }
    } else {
      const existing = await User.findOne({ phone: target, isDeleted: { $ne: true } });
      if (existing) {
        throw new ApiError(409, 'An account with this phone number already exists');
      }
    }
  }

  // Check Rate Limits (Resend Cooldown & Hourly Limit)
  const existingOtp = await Otp.findOne({ target, method: m, purpose: otpPurpose });
  if (existingOtp) {
    const secondsSinceLastSent = (Date.now() - new Date(existingOtp.lastSentAt).getTime()) / 1000;
    if (secondsSinceLastSent < 60) {
      const waitSeconds = Math.ceil(60 - secondsSinceLastSent);
      throw new ApiError(429, `Please wait ${waitSeconds} seconds before requesting another code.`);
    }

    const hoursSinceCreated = (Date.now() - new Date(existingOtp.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreated < 1 && existingOtp.hourlyCount >= 5) {
      throw new ApiError(429, 'Maximum verification code limit reached for this hour. Please try again later.');
    }
  }

  // Generate 6-digit numeric OTP code
  const otpCode = crypto.randomInt(100000, 1000000).toString();
  const otpHash = await bcrypt.hash(otpCode, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes TTL

  const hourlyCount = (existingOtp && (Date.now() - new Date(existingOtp.createdAt).getTime()) < 3600000)
    ? existingOtp.hourlyCount + 1
    : 1;

  // Upsert OTP record with hashed OTP and purpose (invalidates previous pending OTP for this target & purpose)
  await Otp.deleteMany({ target, method: m, purpose: otpPurpose });
  await Otp.create({
    target,
    method: m,
    purpose: otpPurpose,
    otpHash,
    attempts: 0,
    hourlyCount,
    lastSentAt: new Date(),
    expiresAt,
  });

  // Dispatch real SMS or Email
  let delivered = false;
  if (m === 'phone') {
    delivered = await sendSmsOtp(target, otpCode);
    if (!delivered) {
      throw new ApiError(500, 'SMS Gateway credentials not configured on backend server. Add FAST2SMS_API_KEY or TWILIO credentials to backend/.env to send live SMS.');
    }
  } else {
    delivered = await sendEmailOtp(target, otpCode);
    if (!delivered) {
      throw new ApiError(500, 'SMTP Email credentials not configured on backend server. Add SMTP_HOST, SMTP_USER, SMTP_PASS to backend/.env to send live Email.');
    }
  }

  // Production response: Never expose OTP or demo code in response
  return {
    success: true,
    message: `Verification code sent to your ${m === 'email' ? 'email inbox' : 'mobile phone number'}.`,
    target,
    method: m,
    purpose: otpPurpose,
    expiresAt,
  };
}

export async function verifyOtp({ verificationMethod, method, email, phone, target: directTarget, otp, purpose = 'EMAIL_VERIFICATION' }) {
  const m = (verificationMethod || method || (email ? 'email' : 'phone')).toLowerCase();
  const target = directTarget || normalizeTarget(m, email, phone);
  const otpPurpose = purpose.toUpperCase();

  if (!otp || !/^[0-9]{6}$/.test(otp.trim())) {
    throw new ApiError(400, 'Please enter a valid 6-digit numeric verification code');
  }

  const record = await Otp.findOne({ target, method: m, purpose: otpPurpose });
  if (!record || record.expiresAt < new Date()) {
    throw new ApiError(400, 'Verification code has expired or is invalid. Please request a new code.');
  }

  if (record.attempts >= 5) {
    await Otp.deleteOne({ _id: record._id });
    throw new ApiError(400, 'Too many failed attempts. This verification code has been invalidated. Please request a new code.');
  }

  const isMatch = await bcrypt.compare(otp.trim(), record.otpHash);
  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    throw new ApiError(400, `Incorrect verification code (${5 - record.attempts} attempts remaining).`);
  }

  // Verification successful! Delete OTP record to prevent replay attacks
  await Otp.deleteOne({ _id: record._id });
  return true;
}
