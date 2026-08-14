import mongoose from 'mongoose';

const STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

const joinRequestSchema = new mongoose.Schema(
  {
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: true,
      index: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'pending',
      index: true,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Only one active (pending/approved) request per requester per activity.
joinRequestSchema.index(
  { activity: 1, requester: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'approved'] } },
  }
);

// Efficient filtering of join requests by status per activity (host management view)
joinRequestSchema.index({ activity: 1, status: 1 });

joinRequestSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    activity: this.activity,
    requester: this.requester,
    status: this.status,
    message: this.message,
    respondedAt: this.respondedAt,
    createdAt: this.createdAt,
  };
};

export const JOIN_REQUEST_STATUSES = STATUSES;
export const JoinRequest = mongoose.model('JoinRequest', joinRequestSchema);
