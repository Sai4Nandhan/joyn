import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    target: {
      type: String, // email or phone number normalized
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: ['email', 'phone'],
      required: true,
    },
    purpose: {
      type: String,
      enum: ['EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'PASSWORD_RESET'],
      default: 'EMAIL_VERIFICATION',
      required: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    hourlyCount: {
      type: Number,
      default: 1,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Auto-delete on expiration
    },
  },
  { timestamps: true }
);

otpSchema.index({ target: 1, method: 1, purpose: 1 });

export const Otp = mongoose.model('Otp', otpSchema);
