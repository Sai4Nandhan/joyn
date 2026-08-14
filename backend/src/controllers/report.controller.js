import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as reportService from '../services/report.service.js';

export const createReport = asyncHandler(async (req, res) => {
  const report = await reportService.createReport(req.user._id, req.body);
  return ApiResponse(res, 201, { report }, 'Report submitted successfully');
});

export const listReports = asyncHandler(async (req, res) => {
  const data = await reportService.listReports(req.query);
  return ApiResponse(res, 200, data);
});

export const moderateReport = asyncHandler(async (req, res) => {
  const report = await reportService.moderateReport(req.user._id, req.params.id, req.body);
  return ApiResponse(res, 200, { report }, `Report moderated successfully: ${req.body.action}`);
});
