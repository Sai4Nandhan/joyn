import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
  {
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: true,
      index: true,
    },
    rater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ratee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    behavioralFeedback: {
      reliable: { type: Boolean, default: true },
      onTime: { type: Boolean, default: true },
      respectful: { type: Boolean, default: true },
      goodCommunication: { type: Boolean, default: true },
      matchedExpectations: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

ratingSchema.index({ activity: 1, rater: 1, ratee: 1 }, { unique: true });

ratingSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    activity: this.activity,
    rater: this.rater,
    ratee: this.ratee,
    stars: this.stars,
    comment: this.comment,
    behavioralFeedback: this.behavioralFeedback,
    createdAt: this.createdAt,
  };
};

export const Rating = mongoose.model('Rating', ratingSchema);
