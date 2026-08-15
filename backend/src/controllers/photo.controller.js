import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isCloudinaryConfigured } from '../config/env.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

export const uploadPhoto = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');

  if (user.profilePhotos && user.profilePhotos.length >= 5) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }
    throw new ApiError(400, 'Maximum 5 profile photos allowed. Please delete a photo first.');
  }

  if (!req.file) {
    throw new ApiError(400, 'No photo uploaded');
  }

  let finalPhotoUrl = '';
  let finalPublicId = req.file.filename;

  try {
    if (isCloudinaryConfigured()) {
      const cloudinaryResult = await uploadToCloudinary(req.file.path, 'joyn/profiles');
      finalPhotoUrl = cloudinaryResult.secure_url;
      finalPublicId = cloudinaryResult.public_id;
    } else {
      // Fallback for local development when Cloudinary environment variables are not set
      finalPhotoUrl = `/uploads/profiles/${req.file.filename}`;
    }
  } catch (err) {
    console.error('Profile photo storage upload error:', err);
    throw new ApiError(500, `Failed to upload image to cloud storage: ${err.message}`);
  } finally {
    // Always clean up local temporary upload file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }
  }

  const photoId = crypto.randomBytes(8).toString('hex');
  const isFirst = !user.profilePhotos || user.profilePhotos.length === 0;

  const newPhoto = {
    id: photoId,
    url: finalPhotoUrl,
    publicId: finalPublicId,
    isPrimary: isFirst,
    order: user.profilePhotos ? user.profilePhotos.length : 0,
    createdAt: new Date(),
  };

  if (!user.profilePhotos) user.profilePhotos = [];
  user.profilePhotos.push(newPhoto);

  if (isFirst) {
    user.avatarUrl = finalPhotoUrl;
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

  // Attempt Cloudinary deletion if publicId exists, otherwise attempt legacy local disk cleanup
  if (deletedPhoto.publicId && !deletedPhoto.url.startsWith('/uploads/')) {
    await deleteFromCloudinary(deletedPhoto.publicId);
  } else if (deletedPhoto.url && deletedPhoto.url.startsWith('/uploads/profiles/')) {
    const filename = path.basename(deletedPhoto.url);
    const filePath = path.join(process.cwd(), 'uploads', 'profiles', filename);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }
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
