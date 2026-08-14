import mongoose from 'mongoose';

const friendRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
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

friendRequestSchema.index({ sender: 1, recipient: 1 }, { unique: true });
friendRequestSchema.index({ recipient: 1, status: 1 });

export const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);
