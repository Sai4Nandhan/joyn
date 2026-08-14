import { Report } from '../models/Report.js';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';
import { ApiError } from '../utils/ApiError.js';
import { recalculateTrustScore } from './trust.service.js';
import { createNotification } from './notification.service.js';

export async function createReport(reporterId, { targetType, targetUser, targetActivity, reason, description }) {
  if (reporterId.toString() === targetUser.toString()) {
    throw new ApiError(400, "You cannot report yourself");
  }

  const user = await User.findOne({ _id: targetUser, isDeleted: { $ne: true } });
  if (!user) {
    throw new ApiError(404, 'Target user not found');
  }

  if (targetType === 'activity') {
    if (!targetActivity) {
      throw new ApiError(400, 'targetActivity ID is required for activity reports');
    }
    const activity = await Activity.findOne({ _id: targetActivity, isDeleted: { $ne: true } });
    if (!activity) {
      throw new ApiError(404, 'Target activity not found');
    }
    // Verify that the host of the activity is indeed the targetUser
    if (activity.host.toString() !== targetUser.toString()) {
      throw new ApiError(400, 'The target user is not the host of this activity');
    }
  }

  const existingReport = await Report.findOne({
    reporter: reporterId,
    targetUser,
    targetActivity: targetType === 'activity' ? targetActivity : null,
    status: 'pending',
  });
  if (existingReport) {
    throw new ApiError(409, 'You already have an active pending report for this target.');
  }

  const report = await Report.create({
    reporter: reporterId,
    targetType,
    targetUser,
    targetActivity: targetType === 'activity' ? targetActivity : null,
    reason,
    description,
  });

  // Pending reports are signal for admin review and do NOT penalize users automatically.
  // Penalty applies ONLY if resolved by admin moderation.

  return report;
}

export async function listReports({ status, page = 1, limit = 20 }) {
  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [reports, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('reporter', 'name email trustScore')
      .populate('targetUser', 'name email trustScore isSuspended')
      .populate('targetActivity', 'title status'),
    Report.countDocuments(filter),
  ]);

  return { reports, total, page: Number(page), limit: Number(limit) };
}

export async function moderateReport(adminId, reportId, { action, actionTaken }) {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new ApiError(404, 'Report not found');
  }
  if (report.status !== 'pending') {
    throw new ApiError(400, 'This report has already been moderated');
  }

  report.resolvedBy = adminId;
  report.resolvedAt = new Date();

  if (action === 'dismiss') {
    report.status = 'dismissed';
    report.actionTaken = 'none';
    await report.save();

    await createNotification(report.targetUser, {
      type: 'success',
      title: 'Report Dismissed',
      content: 'A compliance report filed regarding your account was reviewed by administrators and dismissed.',
    });
  } else if (action === 'resolve') {
    report.status = 'resolved';
    report.actionTaken = actionTaken || 'none';
    await report.save();

    // Confirmed violation: apply report penalty upon admin resolution
    await User.updateOne({ _id: report.targetUser }, { $inc: { 'stats.reportsAgainst': 1 } });
    await recalculateTrustScore(report.targetUser);

    if (actionTaken === 'suspended') {
      const targetUser = await User.findById(report.targetUser);
      if (targetUser) {
        targetUser.isSuspended = true;
        targetUser.suspendedAt = new Date();
        await targetUser.save();
      }
      await createNotification(report.targetUser, {
        type: 'alert',
        title: 'Account Suspended',
        content: 'Your account has been suspended for community guidelines violations.',
      });
    } else if (actionTaken === 'activity_deleted' && report.targetActivity) {
      const activity = await Activity.findById(report.targetActivity);
      if (activity) {
        activity.isDeleted = true;
        activity.status = 'cancelled';
        await activity.save();
      }
      await createNotification(report.targetUser, {
        type: 'alert',
        title: 'Activity Removed',
        content: `Your activity "${activity?.title || 'Activity'}" was removed by administrators due to community guidelines violations.`,
      });
    } else if (actionTaken === 'warned') {
      await createNotification(report.targetUser, {
        type: 'alert',
        title: 'Compliance Warning Issued',
        content: 'A report against your account was resolved with a formal warning. Please follow the platform guidelines.',
      });
    }
  }

  return Report.findById(reportId)
    .populate('reporter', 'name email trustScore')
    .populate('targetUser', 'name email trustScore isSuspended')
    .populate('targetActivity', 'title status');
}
