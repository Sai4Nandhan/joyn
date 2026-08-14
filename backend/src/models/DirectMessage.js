import mongoose from 'mongoose';

const directMessageSchema = new mongoose.Schema(
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
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

directMessageSchema.index({ sender: 1, recipient: 1, createdAt: 1 });

directMessageSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    sender: this.sender,
    recipient: this.recipient,
    content: this.content,
    isRead: this.isRead,
    createdAt: this.createdAt,
  };
};

export const DirectMessage = mongoose.model('DirectMessage', directMessageSchema);
