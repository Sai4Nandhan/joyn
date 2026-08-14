import mongoose from 'mongoose';

const TYPES = ['message', 'announcement', 'system', 'voice'];

const messageSchema = new mongoose.Schema(
  {
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: TYPES,
      default: 'message',
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    voiceUrl: {
      type: String,
      default: null,
    },
    duration: {
      type: Number,
      default: null,
    },
    mimeType: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

messageSchema.index({ activity: 1, createdAt: 1 });

messageSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    activity: this.activity,
    sender: this.sender,
    type: this.type,
    content: this.content,
    voiceUrl: this.voiceUrl || null,
    duration: this.duration || null,
    mimeType: this.mimeType || null,
    fileSize: this.fileSize || null,
    createdAt: this.createdAt,
  };
};

export const MESSAGE_TYPES = TYPES;
export const Message = mongoose.model('Message', messageSchema);
