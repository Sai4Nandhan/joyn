import mongoose from 'mongoose';
import { Activity } from '../models/Activity.js';
import { User } from '../models/User.js';
import { JoinRequest } from '../models/JoinRequest.js';
import { ApiError } from '../utils/ApiError.js';
import { hasApprovedAccess, listApprovedRequesterIds } from './joinRequest.service.js';
import { recalculateTrustScore } from './trust.service.js';
import { createNotification } from './notification.service.js';
import { evaluateUserChallenges } from './challenge.service.js';
import { escapeRegex } from '../utils/sanitize.js';

export async function createActivity(hostId, payload) {
  const { capacity } = payload;

  if (capacity.min && capacity.min > capacity.max) {
    throw new ApiError(422, 'Minimum capacity cannot exceed maximum capacity');
  }

  let coverImageUrl = payload.coverImageUrl;
  if (!coverImageUrl) {
    const cat = payload.category;
    const titleLower = (payload.title || '').toLowerCase();
    
    if (cat === 'sports') {
      if (titleLower.includes('cricket')) coverImageUrl = '/activity_cricket.png';
      else if (titleLower.includes('football') || titleLower.includes('soccer')) coverImageUrl = '/activity_football.png';
      else coverImageUrl = '/sports_hero.png';
    } else if (cat === 'trips') {
      coverImageUrl = '/activity_goa.png';
    } else if (cat === 'social') {
      if (titleLower.includes('dinner') || titleLower.includes('food') || titleLower.includes('eat')) coverImageUrl = '/dinner_hero.png';
      else coverImageUrl = '/activity_coffee.png';
    } else if (cat === 'travel') {
      coverImageUrl = '/activity_carpool.png';
    } else if (cat === 'trekking') {
      coverImageUrl = '/trekking_hero.png';
    } else if (cat === 'gaming') {
      coverImageUrl = '/gaming_hero.png';
    } else if (cat === 'photography') {
      coverImageUrl = '/activity_goa.png';
    } else if (cat === 'study_groups') {
      coverImageUrl = '/activity_coffee.png';
    } else if (cat === 'events') {
      coverImageUrl = '/dinner_hero.png';
    } else {
      coverImageUrl = '/activity_coffee.png';
    }
  }

  const activity = await Activity.create({
    ...payload,
    coverImageUrl,
    host: hostId,
    status: 'published',
  });

  return activity;
}

export async function getActivityById(id, viewerId) {
  const activity = await Activity.findOne({ _id: id, isDeleted: { $ne: true } }).populate(
    'host',
    'name avatarUrl trustScore isIdentityVerified stats'
  );

  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }

  const isHost = viewerId && activity.host._id.toString() === viewerId.toString();
  const viewerHasApproval = isHost || (await hasApprovedAccess(activity._id, viewerId));

  // Fetch approved participants with details
  const approvedRequests = await JoinRequest.find({ activity: id, status: 'approved' })
    .populate('requester', 'name avatarUrl trustScore isIdentityVerified stats');
  const participants = approvedRequests.map(r => r.requester);

  return {
    ...activity.toPublicJSON(viewerHasApproval),
    participants,
  };
}

export async function listMyActivities(hostId) {
  const activities = await Activity.find({ host: hostId, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
  return activities.map((a) => a.toPublicJSON(true));
}

function shapeDiscoveryResult(a) {
  return {
    id: a._id,
    title: a.title,
    description: a.description,
    category: a.category,
    coverImageUrl: a.coverImageUrl,
    schedule: a.schedule,
    approxLocation: a.approxLocation,
    capacity: a.capacity,
    participantsCount: a.participantsCount,
    distanceMeters: a.distanceMeters ?? null,
    host: a.host
      ? { id: a.host._id, name: a.host.name, avatarUrl: a.host.avatarUrl, trustScore: a.host.trustScore, isIdentityVerified: a.host.isIdentityVerified }
      : null,
  };
}

export async function discoverActivities({ lat, lng, radiusKm = 25, category, search, location, currentUserId, page = 1, limit = 20 }) {
  const baseFilter = {
    isDeleted: { $ne: true },
    status: 'published',
    'schedule.startAt': { $gt: new Date() },
  };

  if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
    baseFilter.host = { $ne: new mongoose.Types.ObjectId(currentUserId) };
  }

  if (category && category !== 'all') {
    baseFilter.category = category;
  }

  if (location) {
    const safeLocation = escapeRegex(location);
    if (safeLocation) {
      baseFilter['approxLocation.placeName'] = { $regex: safeLocation, $options: 'i' };
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  let results = null;

  const validLat = lat !== undefined && lat !== '' && !isNaN(Number(lat));
  const validLng = lng !== undefined && lng !== '' && !isNaN(Number(lng));

  if (validLat && validLng) {
    try {
      console.log(`[discoverActivities] Executing $geoNear at user coordinates [lng: ${lng}, lat: ${lat}], radius: ${radiusKm}km`);
      const pipeline = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
            distanceField: 'distanceMeters',
            key: 'approxLocation.point',
            maxDistance: Number(radiusKm) * 1000,
            spherical: true,
            query: baseFilter,
          },
        },
      ];

      if (search) {
        const safeSearch = escapeRegex(search);
        if (safeSearch) {
          pipeline.push({
            $match: {
              $or: [
                { title: { $regex: safeSearch, $options: 'i' } },
                { description: { $regex: safeSearch, $options: 'i' } },
              ],
            },
          });
        }
      }

      pipeline.push(
        { $sort: { distanceMeters: 1 } },
        { $skip: skip },
        { $limit: Number(limit) },
        { $lookup: { from: 'users', localField: 'host', foreignField: '_id', as: 'host' } },
        { $unwind: '$host' }
      );

      results = await Activity.aggregate(pipeline);
    } catch (err) {
      console.warn('[discoverActivities] $geoNear failed, falling back to standard query', err.message);
    }
  }

  if (!results) {
    const query = { ...baseFilter };
    if (search) {
      const safeSearch = escapeRegex(search);
      if (safeSearch) {
        query.$or = [
          { title: { $regex: safeSearch, $options: 'i' } },
          { description: { $regex: safeSearch, $options: 'i' } },
          { 'approxLocation.placeName': { $regex: safeSearch, $options: 'i' } },
        ];
      }
    }

    results = await Activity.find(query)
      .sort({ 'schedule.startAt': 1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('host', 'name avatarUrl trustScore')
      .lean();
  }

  return results.map(shapeDiscoveryResult);
}

export async function completeActivity(activityId, hostId, noShowUserIds = []) {
  const activity = await Activity.findOne({ _id: activityId, isDeleted: { $ne: true } });
  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }
  if (activity.host.toString() !== hostId.toString()) {
    throw new ApiError(403, 'Only the host can mark an activity as completed');
  }
  if (activity.status !== 'published') {
    throw new ApiError(400, `Activity is already ${activity.status}`);
  }
  if (activity.schedule.endAt > new Date()) {
    throw new ApiError(400, "This activity hasn't ended yet");
  }

  const participantIds = await listApprovedRequesterIds(activityId);
  
  // Separate into real attendees and no-shows
  const noShowsIds = participantIds.filter((id) => noShowUserIds.includes(id.toString()));
  const realAttendees = participantIds.filter((id) => !noShowUserIds.includes(id.toString()));
  const attendeeIds = [activity.host.toString(), ...realAttendees];

  activity.status = 'completed';
  await activity.save();

  // 1. Update stats for attendees
  if (attendeeIds.length > 0) {
    const incUpdate = { 'stats.completedActivities': 1 };
    if (activity.category === 'sports') {
      incUpdate['stats.completedSports'] = 1;
    } else if (['trips', 'travel', 'trekking'].includes(activity.category)) {
      incUpdate['stats.completedTrips'] = 1;
    }

    await User.updateMany({ _id: { $in: attendeeIds } }, { $inc: incUpdate });
    await User.updateOne({ _id: activity.host }, { $inc: { 'stats.activitiesHosted': 1 } });

    await Promise.all(
      attendeeIds.map(async (id) => {
        await recalculateTrustScore(id);
        await evaluateUserChallenges(id);
        await createNotification(id, {
          type: 'alert',
          title: 'Activity Completed',
          content: `"${activity.title}" is marked as completed! Please rate the other participants to complete the feedback loop.`,
        });
      })
    );
  }

  // 2. Update stats for no-shows
  if (noShowsIds.length > 0) {
    await User.updateMany({ _id: { $in: noShowsIds } }, { $inc: { 'stats.noShows': 1 } });
    await Promise.all(
      noShowsIds.map(async (id) => {
        await recalculateTrustScore(id);
        await createNotification(id, {
          type: 'alert',
          title: 'No-Show Recorded',
          content: `You were marked as a no-show for "${activity.title}". This has lowered your Trust Score.`,
        });
      })
    );
  }

  return activity.toPublicJSON(true);
}

export async function cancelActivity(activityId, hostId) {
  const activity = await Activity.findOne({ _id: activityId, isDeleted: { $ne: true } });
  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }
  if (activity.host.toString() !== hostId.toString()) {
    throw new ApiError(403, 'Only the host can cancel this activity');
  }
  if (activity.status !== 'published') {
    throw new ApiError(400, `Activity is already ${activity.status}`);
  }

  activity.status = 'cancelled';
  await activity.save();

  // Penalize host's trust score by incrementing cancellations
  await User.updateOne({ _id: hostId }, { $inc: { 'stats.cancellations': 1 } });
  await recalculateTrustScore(hostId);

  // Notify all approved participants
  const participantIds = await listApprovedRequesterIds(activityId);
  if (participantIds.length > 0) {
    await Promise.all(
      participantIds.map(async (id) => {
        await createNotification(id, {
          type: 'alert',
          title: 'Activity Cancelled',
          content: `"${activity.title}" has been cancelled by the host.`,
        });
      })
    );
  }

  return activity.toPublicJSON(true);
}

export async function publishActivity(activityId, hostId) {
  const activity = await Activity.findOne({ _id: activityId, isDeleted: { $ne: true } });
  if (!activity) throw new ApiError(404, 'Activity not found');
  if (activity.host.toString() !== hostId.toString()) {
    throw new ApiError(403, 'Only the host can publish this activity');
  }
  if (activity.status !== 'draft') {
    throw new ApiError(400, `Activity is already ${activity.status}`);
  }
  activity.status = 'published';
  await activity.save();
  return activity.toPublicJSON(true);
}

export async function deleteActivity(activityId, hostId) {
  const activity = await Activity.findOne({ _id: activityId, isDeleted: { $ne: true } });
  if (!activity) throw new ApiError(404, 'Activity not found');
  if (activity.host.toString() !== hostId.toString()) {
    throw new ApiError(403, 'Only the host can delete this activity');
  }
  if (activity.status === 'published') {
    // Notify approved participants before deletion
    const participantIds = await listApprovedRequesterIds(activityId);
    if (participantIds.length > 0) {
      await Promise.all(
        participantIds.map((id) =>
          createNotification(id, {
            type: 'alert',
            title: 'Activity Removed',
            content: `"${activity.title}" has been removed by the host.`,
          })
        )
      );
    }
  }
  activity.isDeleted = true;
  await activity.save();
  return { deleted: true };
}
