import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['info', 'success', 'alert', 'badge', 'announcement'],
      default: 'info',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      default: null,
      trim: true,
    },
    unread: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

notificationSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    type: this.type,
    title: this.title,
    content: this.content,
    link: this.link || null,
    unread: this.unread,
    createdAt: this.createdAt,
  };
};

export const Notification = mongoose.model('Notification', notificationSchema);
