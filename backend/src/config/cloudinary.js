import { v2 as cloudinary } from 'cloudinary';
import { env, isCloudinaryConfigured } from './env.js';

let isInitialized = false;

function initCloudinary() {
  if (!isInitialized && isCloudinaryConfigured()) {
    if (env.cloudinary.url) {
      cloudinary.config({
        cloudinary_url: env.cloudinary.url,
        secure: true,
      });
    } else {
      cloudinary.config({
        cloud_name: env.cloudinary.cloudName,
        api_key: env.cloudinary.apiKey,
        api_secret: env.cloudinary.apiSecret,
        secure: true,
      });
    }
    isInitialized = true;
  }
  return isInitialized;
}


/**
 * Uploads a local file to Cloudinary.
 * @param {string} filePath - Absolute path of the temporary file to upload.
 * @param {string} folder - Destination folder on Cloudinary (default: 'joyn/profiles').
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export async function uploadToCloudinary(filePath, folder = 'joyn/profiles') {
  if (!initCloudinary()) {
    throw new Error('Cloudinary environment variables are not configured.');
  }

  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image',
  });

  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
  };
}

/**
 * Deletes an asset from Cloudinary by its publicId.
 * @param {string} publicId - Cloudinary publicId (e.g. 'joyn/profiles/profile-xxx').
 * @returns {Promise<boolean>}
 */
export async function deleteFromCloudinary(publicId) {
  if (!publicId || !initCloudinary()) {
    return false;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error(`[Cloudinary Warning] Failed to delete asset ${publicId}:`, error.message);
    return false;
  }
}
