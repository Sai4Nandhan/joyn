import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 120 },
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { _id: true }
);

const pollSchema = new mongoose.Schema(
  {
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: (v) => v.length >= 2 && v.length <= 10,
        message: 'A poll needs 2-10 options',
      },
    },
    allowMultiple: {
      type: Boolean,
      default: false,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
    closesAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

pollSchema.index({ activity: 1, createdAt: -1 });

pollSchema.methods.toPublicJSON = function (viewerId) {
  return {
    id: this._id,
    activity: this.activity,
    question: this.question,
    allowMultiple: this.allowMultiple,
    isClosed: this.isClosed || (this.closesAt && this.closesAt < new Date()),
    closesAt: this.closesAt,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
    options: this.options.map((opt) => ({
      id: opt._id,
      text: opt.text,
      voteCount: opt.votes.length,
      votedByMe: viewerId ? opt.votes.some((v) => v.toString() === viewerId.toString()) : false,
    })),
  };
};

export const Poll = mongoose.model('Poll', pollSchema);
