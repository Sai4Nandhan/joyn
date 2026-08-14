import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, Star, Trash2, ChevronLeft, ChevronRight, Upload, X, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { uploadProfilePhoto, deleteProfilePhoto, setPrimaryPhoto, reorderPhotos } from '../../services/photoService.js';

import { getImageUrl } from '../../utils/imageUrl.js';

export function ProfilePhotoGallery({ profile, onProfileUpdate }) {
  const photos = profile?.profilePhotos || [];
  const primaryPhotoUrl = profile?.avatarUrl;
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [actingPhotoId, setActingPhotoId] = useState(null);
  const [replaceTargetId, setReplaceTargetId] = useState(null);

  const canAddMore = photos.length < 5;

  function handleFileSelect(e, targetId = null) {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid JPEG, PNG, or WebP image.');
      return;
    }

    setSelectedFile(file);
    setReplaceTargetId(targetId);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleConfirmUpload() {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    try {
      if (replaceTargetId) {
        // Replace photo: delete target photo first, then upload new one
        await deleteProfilePhoto(replaceTargetId);
      }
      const updatedUser = await uploadProfilePhoto(selectedFile);
      onProfileUpdate(updatedUser);
      setSelectedFile(null);
      setPreviewUrl(null);
      setReplaceTargetId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(photoId) {
    setActingPhotoId(photoId);
    setError(null);
    try {
      const updatedUser = await deleteProfilePhoto(photoId);
      onProfileUpdate(updatedUser);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete photo.');
    } finally {
      setActingPhotoId(null);
    }
  }

  async function handleSetPrimary(photoId) {
    setActingPhotoId(photoId);
    setError(null);
    try {
      const updatedUser = await setPrimaryPhoto(photoId);
      onProfileUpdate(updatedUser);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update primary photo.');
    } finally {
      setActingPhotoId(null);
    }
  }

  async function handleMove(index, direction) {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === photos.length - 1) return;

    const newPhotos = [...photos];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[targetIndex];
    newPhotos[targetIndex] = temp;

    const photoIds = newPhotos.map((p) => p.id);
    setError(null);
    try {
      const updatedUser = await reorderPhotos(photoIds);
      onProfileUpdate(updatedUser);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reorder photos.');
    }
  }

  return (
    <div className="rounded-2xl border border-ink-100 bg-white/80 p-6 shadow-card dark:bg-[#0D1026] dark:border-purple-950/20 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-extrabold text-ink-900 dark:text-white flex items-center gap-2">
            <Camera className="h-5 w-5 text-brand-500" /> Profile Photos
          </h3>
          <p className="text-xs text-ink-400 dark:text-slate-400 mt-0.5">
            Upload up to 5 profile photos ({photos.length}/5 used). Set your primary photo for activities.
          </p>
        </div>

        {canAddMore && (
          <label className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-brand-600 transition-all cursor-pointer">
            <Plus className="h-4 w-4" /> Add Photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileSelect(e, null)}
              className="hidden"
            />
          </label>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200">
          <span>{error}</span>
        </div>
      )}

      {/* Photos Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {photos.map((photo, idx) => {
          const isPrimary = photo.isPrimary || photo.url === primaryPhotoUrl;
          const isActing = actingPhotoId === photo.id;

          return (
            <motion.div
              key={photo.id || idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all shadow-sm ${
                isPrimary
                  ? 'border-brand-500 ring-2 ring-brand-100 dark:ring-brand-900/40'
                  : 'border-ink-150 hover:border-brand-300 dark:border-slate-800'
              }`}
            >
              <img
                src={getImageUrl(photo.url)}
                alt={`Profile photo ${idx + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Primary Badge */}
              {isPrimary && (
                <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-brand-500/90 backdrop-blur-md px-2 py-0.5 text-[9px] font-extrabold uppercase text-white shadow">
                  <Star className="h-3 w-3 fill-current" /> Primary
                </div>
              )}

              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-ink-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex items-center justify-between">
                  {/* Reorder Left */}
                  {idx > 0 ? (
                    <button
                      onClick={() => handleMove(idx, 'left')}
                      title="Move Left"
                      className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/40 transition-colors"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                  ) : <div />}

                  {/* Reorder Right */}
                  {idx < photos.length - 1 ? (
                    <button
                      onClick={() => handleMove(idx, 'right')}
                      title="Move Right"
                      className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/40 transition-colors"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  ) : <div />}

                  {/* Delete Photo */}
                  <button
                    onClick={() => handleDelete(photo.id)}
                    disabled={isActing}
                    title="Delete photo"
                    className="p-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="w-full py-1 rounded-lg bg-white/20 text-white text-[9px] font-bold uppercase tracking-wider hover:bg-white/30 transition-colors flex items-center justify-center gap-1 cursor-pointer">
                    <RefreshCw className="h-3 w-3" /> Replace
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleFileSelect(e, photo.id)}
                      className="hidden"
                    />
                  </label>

                  {!isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(photo.id)}
                      disabled={isActing}
                      className="w-full py-1.5 rounded-lg bg-brand-500 text-white text-3xs font-extrabold uppercase tracking-wider hover:bg-brand-600 transition-colors"
                    >
                      Set Primary
                    </button>
                  )}
                </div>
              </div>

              {isActing && (
                <div className="absolute inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
              )}
            </motion.div>
          );
        })}


        {/* Empty slots placeholders */}
        {Array.from({ length: 5 - photos.length }).map((_, idx) => (
          <label
            key={`empty-${idx}`}
            className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-ink-200 dark:border-slate-800 bg-ink-50/40 dark:bg-slate-900/20 hover:bg-brand-50/20 hover:border-brand-300 transition-all cursor-pointer group"
          >
            <ImageIcon className="h-6 w-6 text-ink-300 dark:text-slate-600 group-hover:text-brand-400 transition-colors" />
            <span className="text-[10px] font-bold text-ink-400 dark:text-slate-500 group-hover:text-brand-500 mt-1">
              Add Photo
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        ))}
      </div>

      {/* Upload Preview Modal */}
      <AnimatePresence>
        {previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#0D1026] p-6 shadow-2xl border border-ink-100 dark:border-purple-950/30"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-extrabold text-ink-900 dark:text-white">
                  Preview Photo
                </h4>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="text-ink-400 hover:text-ink-600 dark:text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="aspect-square rounded-2xl overflow-hidden border border-ink-150 mb-4 bg-ink-900">
                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
              </div>

              <p className="text-3xs text-ink-400 dark:text-slate-400 mb-4 text-center">
                Photo will be optimized and saved to your JOYN profile.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-ink-200 text-xs font-bold text-ink-600 hover:bg-ink-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 text-xs font-bold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
                >
                  {isUploading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4" /> Save Photo
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
