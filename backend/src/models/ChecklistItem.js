import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema(
  {
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    isDone: {
      type: Boolean,
      default: false,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

checklistItemSchema.index({ activity: 1, createdAt: 1 });

checklistItemSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    activity: this.activity,
    title: this.title,
    isDone: this.isDone,
    assignedTo: this.assignedTo,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
  };
};

export const ChecklistItem = mongoose.model('ChecklistItem', checklistItemSchema);
