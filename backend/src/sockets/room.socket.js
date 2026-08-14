import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import * as roomService from '../services/room.service.js';
import { ApiError } from '../utils/ApiError.js';

let ioInstance = null;

function roomChannel(activityId) {
  return `room:${activityId}`;
}

export function initRoomSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  ioInstance = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new ApiError(401, 'Authentication required');

      const payload = verifyAccessToken(token);
      const user = await User.findOne({ _id: payload.sub, isDeleted: { $ne: true } });
      if (!user) throw new ApiError(401, 'Invalid session');

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // Join personal user channel for real-time notifications and direct messages
    socket.join(`user:${socket.user._id.toString()}`);

    socket.on('room:join', async ({ activityId }, ack) => {
      try {
        await roomService.assertRoomAccess(activityId, socket.user._id);
        socket.join(roomChannel(activityId));
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on('room:leave', ({ activityId }) => {
      socket.leave(roomChannel(activityId));
    });

    socket.on('room:message', async ({ activityId, content, type, voiceUrl, duration, mimeType, fileSize }, ack) => {
      try {
        const message = await roomService.createMessage(activityId, socket.user._id, {
          content,
          type,
          voiceUrl,
          duration,
          mimeType,
          fileSize,
        });
        io.to(roomChannel(activityId)).emit('room:message', message.toPublicJSON());
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });
  });

  return io;
}

export function emitToUser(userId, event, data) {
  if (ioInstance && userId) {
    ioInstance.to(`user:${userId.toString()}`).emit(event, data);
  }
}

export function broadcastRoomMessage(activityId, messageData) {
  if (ioInstance && activityId) {
    ioInstance.to(roomChannel(activityId)).emit('room:message', messageData);
  }
}

/**
 * Checks if a specific user is actively joined in the socket room channel.
 */
export function isUserInSocketRoom(userId, activityId) {
  if (!ioInstance) return false;
  const channel = roomChannel(activityId);
  const roomSockets = ioInstance.sockets.adapter.rooms.get(channel);
  if (!roomSockets) return false;

  for (const socketId of roomSockets) {
    const socket = ioInstance.sockets.sockets.get(socketId);
    if (socket && socket.user && socket.user._id.toString() === userId.toString()) {
      return true;
    }
  }
  return false;
}
