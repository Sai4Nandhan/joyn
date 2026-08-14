import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
      maxlength: 3,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Members sharing this cost. Empty = split evenly across everyone in the room.
    splitBetween: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

expenseSchema.index({ activity: 1, createdAt: -1 });

expenseSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    activity: this.activity,
    description: this.description,
    amount: this.amount,
    currency: this.currency,
    paidBy: this.paidBy,
    splitBetween: this.splitBetween,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
  };
};

export const Expense = mongoose.model('Expense', expenseSchema);
