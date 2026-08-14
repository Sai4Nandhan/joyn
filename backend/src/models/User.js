import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    verificationMethod: {
      type: String,
      enum: ['email', 'phone'],
      default: 'email',
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isIdentityVerified: {
      type: Boolean,
      default: false,
    },
    hasCompletedOnboarding: {
      type: Boolean,
      default: false,
    },
    moderationState: {
      type: String,
      enum: ['NORMAL', 'LOW_REPUTATION', 'SUSPICIOUS', 'CONFIRMED_SPAM', 'SERIOUS_ABUSE', 'PERMANENTLY_BANNED'],
      default: 'NORMAL',
    },
    reputationStatus: {
      type: String,
      enum: ['NORMAL', 'LIMITED'],
      default: 'NORMAL',
    },
    riskStatus: {
      type: String,
      enum: ['NORMAL', 'ELEVATED', 'HIGH'],
      default: 'NORMAL',
    },
    securityAudit: [
      {
        linkageSignal: String,
        confidenceLevel: String,
        linkedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        previousAccountStatus: String,
        reason: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    trustScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    stats: {
      completedActivities: { type: Number, default: 0 },
      cancellations: { type: Number, default: 0 },
      noShows: { type: Number, default: 0 },
      reportsAgainst: { type: Number, default: 0 },
      ratingSum: { type: Number, default: 0 },
      ratingCount: { type: Number, default: 0 },
      activitiesHosted: { type: Number, default: 0 },
      completedSports: { type: Number, default: 0 },
      completedTrips: { type: Number, default: 0 },
      reliableSum: { type: Number, default: 0 },
      onTimeSum: { type: Number, default: 0 },
      respectfulSum: { type: Number, default: 0 },
      goodCommunicationSum: { type: Number, default: 0 },
      matchedExpectationsSum: { type: Number, default: 0 },
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    profilePhotos: [
      {
        id: { type: String, required: true },
        url: { type: String, required: true },
        publicId: { type: String, default: null },
        isPrimary: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    verification: {
      status: {
        type: String,
        enum: ['NOT_STARTED', 'PENDING', 'VERIFIED', 'FAILED', 'REQUIRES_RETRY', 'REQUIRES_REVIEW'],
        default: 'NOT_STARTED',
      },
      submittedAt: { type: Date, default: null },
      verifiedAt: { type: Date, default: null },
      provider: { type: String, default: 'JOYN_IDENTITY_PROVIDER' },
      providerReference: { type: String, default: null },
      rejectionReason: { type: String, default: null },
      attemptCount: { type: Number, default: 0 },
      lastAttemptAt: { type: Date, default: null },
      selfieUrl: { type: String, default: null, select: false },
      documentUrl: { type: String, default: null, select: false },
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    savedActivities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
      },
    ],
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    settings: {
      emailNotify: { type: Boolean, default: true },
      pushNotify: { type: Boolean, default: false },
      profilePrivate: { type: Boolean, default: false },
      showLocation: { type: Boolean, default: true },
      notificationsEnabled: { type: Boolean, default: true },
      notificationCategories: {
        activityUpdates: { type: Boolean, default: true },
        joinRequests: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
        roomMessages: { type: Boolean, default: true },
        ratings: { type: Boolean, default: true },
        trustScore: { type: Boolean, default: true },
        challenges: { type: Boolean, default: true },
        announcements: { type: Boolean, default: true },
      },
    },
    mutedRooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
      },
    ],
    unlockedBadges: [
      {
        badgeId: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

userSchema.index({ isDeleted: 1 });
userSchema.index({ isSuspended: 1 });
userSchema.index({ trustScore: -1 }); // for leaderboard/ranking queries

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
};

userSchema.methods.toSafeJSON = function () {
  const primaryPhoto = (this.profilePhotos && this.profilePhotos.find((p) => p.isPrimary))?.url;
  const effectiveAvatar = primaryPhoto || this.avatarUrl;

  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    verificationMethod: this.verificationMethod,
    role: this.role,
    isEmailVerified: this.isEmailVerified,
    isPhoneVerified: this.isPhoneVerified,
    isIdentityVerified: !!(this.isIdentityVerified || this.verification?.status === 'VERIFIED'),
    isSuspended: this.isSuspended,
    bio: this.bio,
    trustScore: this.trustScore,
    stats: this.stats,
    avatarUrl: effectiveAvatar,
    profilePhotos: this.profilePhotos || [],
    verification: {
      status: this.verification?.status || (this.isIdentityVerified ? 'VERIFIED' : 'NOT_STARTED'),
      submittedAt: this.verification?.submittedAt || null,
      verifiedAt: this.verification?.verifiedAt || null,
      rejectionReason: this.verification?.rejectionReason || null,
      provider: this.verification?.provider || 'JOYN_VERIFY',
    },
    savedActivities: this.savedActivities,
    hasCompletedOnboarding: Boolean(this.hasCompletedOnboarding),
    settings: {
      emailNotify: this.settings?.emailNotify ?? true,
      pushNotify: this.settings?.pushNotify ?? false,
      profilePrivate: this.settings?.profilePrivate ?? false,
      showLocation: this.settings?.showLocation ?? true,
      notificationsEnabled: this.settings?.notificationsEnabled ?? true,
      notificationCategories: {
        activityUpdates: this.settings?.notificationCategories?.activityUpdates ?? true,
        joinRequests: this.settings?.notificationCategories?.joinRequests ?? true,
        messages: this.settings?.notificationCategories?.messages ?? true,
        roomMessages: this.settings?.notificationCategories?.roomMessages ?? true,
        ratings: this.settings?.notificationCategories?.ratings ?? true,
        trustScore: this.settings?.notificationCategories?.trustScore ?? true,
        challenges: this.settings?.notificationCategories?.challenges ?? true,
        announcements: this.settings?.notificationCategories?.announcements ?? true,
      },
    },
    mutedRooms: (this.mutedRooms || []).map(String),
    createdAt: this.createdAt,
  };
};

userSchema.methods.toPublicProfileJSON = function () {
  const primaryPhoto = (this.profilePhotos && this.profilePhotos.find((p) => p.isPrimary))?.url;
  const effectiveAvatar = primaryPhoto || this.avatarUrl;

  return {
    id: this._id,
    name: this.name,
    bio: this.bio,
    isIdentityVerified: !!(this.isIdentityVerified || this.verification?.status === 'VERIFIED'),
    trustScore: this.trustScore,
    stats: this.stats,
    avatarUrl: effectiveAvatar,
    profilePhotos: this.profilePhotos || [],
    verificationStatus: this.verification?.status || (this.isIdentityVerified ? 'VERIFIED' : 'NOT_STARTED'),
    memberSince: this.createdAt,
  };
};


export const User = mongoose.model('User', userSchema);
