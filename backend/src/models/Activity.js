import mongoose from 'mongoose';

const CATEGORIES = ['trips', 'sports', 'social', 'travel', 'photography', 'gaming', 'study_groups', 'events', 'trekking'];
const STATUSES = ['draft', 'published', 'cancelled', 'completed'];

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 2,
        message: 'Coordinates must be [longitude, latitude]',
      },
    },
  },
  { _id: false }
);

const activitySchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
      index: true,
    },
    coverImageUrl: {
      type: String,
      default: null,
    },
    schedule: {
      startAt: { type: Date, required: true },
      endAt: { type: Date, required: true },
    },
    // Shown to everyone before a join request is approved.
    approxLocation: {
      point: { type: pointSchema, required: true },
      placeName: { type: String, required: true, trim: true },
    },
    // Only revealed to approved participants (see location privacy rules).
    exactLocation: {
      point: { type: pointSchema, required: true },
      address: { type: String, trim: true },
      meetingPoint: { type: String, trim: true },
      mapUrl: { type: String, trim: true, default: null },
    },
    cost: {
      isFree: { type: Boolean, default: true },
      amount: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: 'INR' },
    },
    capacity: {
      min: { type: Number, default: 1, min: 1 },
      max: { type: Number, required: true, min: 1 },
    },
    participantsCount: {
      type: Number,
      default: 1, // host counts as a participant
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'draft',
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  { timestamps: true }
);

activitySchema.index({ 'approxLocation.point': '2dsphere' });
activitySchema.index({ title: 'text', description: 'text' });
activitySchema.index({ isDeleted: 1, status: 1 });

activitySchema.methods.toPublicJSON = function (viewerHasApproval = false) {
  return {
    id: this._id,
    host: this.host,
    title: this.title,
    description: this.description,
    category: this.category,
    coverImageUrl: this.coverImageUrl,
    schedule: this.schedule,
    approxLocation: this.approxLocation,
    exactLocation: viewerHasApproval ? this.exactLocation : undefined,
    capacity: this.capacity,
    participantsCount: this.participantsCount,
    status: this.status,
    cost: this.cost,
    createdAt: this.createdAt,
  };
};

export const ACTIVITY_CATEGORIES = CATEGORIES;
export const Activity = mongoose.model('Activity', activitySchema);
