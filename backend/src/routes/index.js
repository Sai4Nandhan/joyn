import { Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from './auth.routes.js';
import activityRoutes from './activity.routes.js';
import joinRequestRoutes from './joinRequest.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';
import reportRoutes from './report.routes.js';
import dmRoutes from './dm.routes.js';
import notificationRoutes from './notification.routes.js';
import photoRoutes from './photo.routes.js';
import verificationRoutes from './verification.routes.js';
import friendRoutes from './friend.routes.js';
import challengeRoutes from './challenge.routes.js';


import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    const dbConnected = mongoose.connection.readyState === 1;
    if (!dbConnected) {
      return res.status(503).json({
        success: false,
        message: 'Server is running, but database connection is offline',
        data: { db: 'disconnected' },
      });
    }
    return res.json({ success: true, message: 'ok', data: { db: 'connected' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, data: { db: 'error' } });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const usersCount = await User.countDocuments({ isDeleted: { $ne: true } });
    const activitiesCount = await Activity.countDocuments({ isDeleted: { $ne: true } });
    const completedCount = await Activity.countDocuments({ isDeleted: { $ne: true }, status: 'completed' });
    
    // Get unique cities
    const cities = await Activity.distinct('approxLocation.placeName', { isDeleted: { $ne: true } });
    const citiesCount = cities.length;

    // Get verified users count
    const verifiedUsersCount = await User.countDocuments({ isDeleted: { $ne: true }, isIdentityVerified: true });

    return res.json({
      success: true,
      data: {
        usersCount,
        activitiesCount,
        completedCount,
        citiesCount: citiesCount || 1,
        verifiedUsersCount,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.use('/auth', authRoutes);
router.use('/activities', activityRoutes);
router.use('/join-requests', joinRequestRoutes);
router.use('/users/me/photos', photoRoutes);
router.use('/users', userRoutes);
router.use('/verification', verificationRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);
router.use('/dms', dmRoutes);
router.use('/notifications', notificationRoutes);
router.use('/friends', friendRoutes);
router.use('/challenges', challengeRoutes);


export default router;
