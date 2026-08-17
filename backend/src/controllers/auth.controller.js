import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import * as authService from '../services/auth.service.js';

const REFRESH_COOKIE = 'refreshToken';

const cookieOptions = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: 'lax',
  path: '/api/auth',
};

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function meta(req) {
  return { userAgent: req.headers['user-agent'], ip: req.ip };
}

import * as otpService from '../services/otp.service.js';

export const sendOtp = asyncHandler(async (req, res) => {
  const result = await otpService.sendOtp(req.body);
  return ApiResponse(res, 200, result, result.message);
});



export const verifyOtp = asyncHandler(async (req, res) => {
  await otpService.verifyOtp(req.body);
  return ApiResponse(res, 200, { verified: true }, 'OTP verified successfully');
});

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body, meta(req));
  setRefreshCookie(res, refreshToken);
  return ApiResponse(res, 201, { user: user.toSafeJSON(), accessToken }, 'Account created');
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body, meta(req));
  setRefreshCookie(res, refreshToken);
  return ApiResponse(res, 200, { user: user.toSafeJSON(), accessToken }, 'Logged in');
});

export const refresh = asyncHandler(async (req, res) => {
  const oldToken = req.cookies?.[REFRESH_COOKIE];
  const { user, accessToken, refreshToken } = await authService.refresh(oldToken, meta(req));
  setRefreshCookie(res, refreshToken);
  return ApiResponse(res, 200, { user: user.toSafeJSON(), accessToken }, 'Session refreshed');
});

export const logout = asyncHandler(async (req, res) => {
  const oldToken = req.cookies?.[REFRESH_COOKIE];
  await authService.logout(oldToken);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  return ApiResponse(res, 200, null, 'Logged out');
});

export const me = asyncHandler(async (req, res) => {
  return ApiResponse(res, 200, { user: req.user.toSafeJSON() });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  return ApiResponse(res, 200, result, result.message);
});

export const verifyResetOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyResetOtp(req.body);
  return ApiResponse(res, 200, result, result.message);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  return ApiResponse(res, 200, result, result.message);
});
