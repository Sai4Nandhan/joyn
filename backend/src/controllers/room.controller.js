import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import * as roomService from '../services/room.service.js';
import { broadcastRoomMessage } from '../sockets/room.socket.js';
import { env } from '../config/env.js';

// Setup voice upload directory
const voiceUploadDir = path.join(process.cwd(), 'uploads', 'voice');
if (!fs.existsSync(voiceUploadDir)) {
  fs.mkdirSync(voiceUploadDir, { recursive: true });
}

function getAudioExtension(mimetype, originalname) {
  const origExt = path.extname(originalname);
  if (origExt && origExt.length > 1) return origExt;

  switch (mimetype) {
    case 'audio/mp4':
    case 'audio/x-m4a':
      return '.m4a';
    case 'audio/ogg':
      return '.ogg';
    case 'audio/wav':
      return '.wav';
    case 'audio/mpeg':
    case 'audio/mp3':
      return '.mp3';
    case 'audio/webm':
    default:
      return '.webm';
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, voiceUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = getAudioExtension(file.mimetype, file.originalname);
    cb(null, `voice_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
    'audio/wav',
    'audio/x-m4a',
    'audio/aac',
    'audio/mpeg',
    'audio/mp3',
  ];
  if (allowedMimeTypes.includes(file.mimetype) || (file.mimetype && file.mimetype.startsWith('audio/'))) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid audio file format. Only audio files are allowed.'));
  }
};

const uploadSingleAudio = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
}).single('audio');

export const uploadVoiceMiddleware = (req, res, next) => {
  uploadSingleAudio(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return next(new ApiError(400, `Audio upload error: ${err.message}`));
      }
      return next(err);
    }
    next();
  });
};

export const getMessages = asyncHandler(async (req, res) => {
  const messages = await roomService.listMessages(req.params.id, req.user._id, {
    before: req.query.before,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  return ApiResponse(res, 200, { messages: messages.map((m) => m.toPublicJSON()) });
});

export const getMembers = asyncHandler(async (req, res) => {
  const { host, members } = await roomService.listMembers(req.params.id, req.user._id);
  return ApiResponse(res, 200, { host, members });
});

export const toggleMute = asyncHandler(async (req, res) => {
  const result = await roomService.toggleMuteRoom(req.user._id, req.params.id);
  return ApiResponse(res, 200, result, result.isMuted ? 'Notifications muted for this room' : 'Notifications unmuted for this room');
});

export const getMuteStatus = asyncHandler(async (req, res) => {
  const result = await roomService.getMuteStatus(req.user._id, req.params.id);
  return ApiResponse(res, 200, result);
});

export const uploadVoiceMessage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No audio file uploaded. Please select an audio file.');
  }

  const rawDuration = req.body.duration ? Number(req.body.duration) : 0;
  const duration = isNaN(rawDuration) || rawDuration < 0 ? 0 : Math.round(rawDuration);
  const voiceUrl = `/uploads/voice/${req.file.filename}`;

  if (env.nodeEnv === 'development') {
    console.log('[VOICE UPLOAD DEBUG]', {
      activityId: req.params.id,
      userId: req.user._id.toString(),
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      duration,
    });
  }

  const message = await roomService.createMessage(req.params.id, req.user._id, {
    content: '🎙️ Voice Message',
    type: 'voice',
    voiceUrl,
    duration,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
  });

  const publicMessage = message.toPublicJSON();

  // Broadcast real-time Socket.io event to room channel
  broadcastRoomMessage(req.params.id, publicMessage);

  return ApiResponse(res, 201, { message: publicMessage }, 'Voice message sent');
});
