import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const uploadPhoto = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');

  if (user.profilePhotos && user.profilePhotos.length >= 5) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    throw new ApiError(400, 'Maximum 5 profile photos allowed. Please delete a photo first.');
  }

  if (!req.file) {
    throw new ApiError(400, 'No photo uploaded');
  }

  const photoUrl = `/uploads/profiles/${req.file.filename}`;
  const photoId = crypto.randomBytes(8).toString('hex');
  const isFirst = !user.profilePhotos || user.profilePhotos.length === 0;

  const newPhoto = {
    id: photoId,
    url: photoUrl,
    publicId: req.file.filename,
    isPrimary: isFirst,
    order: user.profilePhotos ? user.profilePhotos.length : 0,
    createdAt: new Date(),
  };

  if (!user.profilePhotos) user.profilePhotos = [];
  user.profilePhotos.push(newPhoto);

  if (isFirst) {
    user.avatarUrl = photoUrl;
  }

  await user.save();
  return ApiResponse(res, 201, { user: user.toSafeJSON() }, 'Profile photo uploaded successfully');
});

export const deletePhoto = asyncHandler(async (req, res) => {
  const { photoId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');

  const photoIndex = user.profilePhotos.findIndex((p) => p.id === photoId);
  if (photoIndex === -1) {
    throw new ApiError(404, 'Photo not found');
  }

  const [deletedPhoto] = user.profilePhotos.splice(photoIndex, 1);

  // Attempt local disk deletion if it's a local upload
  if (deletedPhoto.url.startsWith('/uploads/profiles/')) {
    const filename = path.basename(deletedPhoto.url);
    const filePath = path.join(process.cwd(), 'uploads', 'profiles', filename);
    fs.unlink(filePath, () => {});
  }

  // If deleted photo was primary and remaining photos exist, promote first remaining photo to primary
  if (deletedPhoto.isPrimary && user.profilePhotos.length > 0) {
    user.profilePhotos[0].isPrimary = true;
    user.avatarUrl = user.profilePhotos[0].url;
  } else if (user.profilePhotos.length === 0) {
    user.avatarUrl = null;
  }

  // Re-index order
  user.profilePhotos.forEach((p, idx) => {
    p.order = idx;
  });

  await user.save();
  return ApiResponse(res, 200, { user: user.toSafeJSON() }, 'Photo deleted successfully');
});

export const setPrimaryPhoto = asyncHandler(async (req, res) => {
  const { photoId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');

  const target = user.profilePhotos.find((p) => p.id === photoId);
  if (!target) {
    throw new ApiError(404, 'Photo not found');
  }

  user.profilePhotos.forEach((p) => {
    p.isPrimary = p.id === photoId;
  });
  user.avatarUrl = target.url;

  await user.save();
  return ApiResponse(res, 200, { user: user.toSafeJSON() }, 'Primary profile photo updated');
});

export const reorderPhotos = asyncHandler(async (req, res) => {
  const { photoIds } = req.body; // Array of photo ids in new order
  if (!Array.isArray(photoIds)) {
    throw new ApiError(400, 'photoIds must be an array');
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');

  const photoMap = new Map(user.profilePhotos.map((p) => [p.id, p]));
  const reordered = [];

  for (let i = 0; i < photoIds.length; i++) {
    const photo = photoMap.get(photoIds[i]);
    if (photo) {
      photo.order = i;
      reordered.push(photo);
      photoMap.delete(photoIds[i]);
    }
  }

  // Append any unreferenced photos
  for (const remaining of photoMap.values()) {
    remaining.order = reordered.length;
    reordered.push(remaining);
  }

  user.profilePhotos = reordered;
  await user.save();
  return ApiResponse(res, 200, { user: user.toSafeJSON() }, 'Photos reordered successfully');
});
