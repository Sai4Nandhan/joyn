import { ChecklistItem } from '../models/ChecklistItem.js';
import { ApiError } from '../utils/ApiError.js';
import { assertRoomAccess } from './room.service.js';

export async function createItem(activityId, userId, { title, assignedTo }) {
  const { activity } = await assertRoomAccess(activityId, userId);
  if (activity.status === 'cancelled') {
    throw new ApiError(400, 'Cannot add checklist items for a cancelled activity');
  }

  const item = await ChecklistItem.create({
    activity: activityId,
    title,
    assignedTo: assignedTo || null,
    createdBy: userId,
  });

  return ChecklistItem.findById(item._id).populate('assignedTo', 'name avatarUrl');
}

export async function listItems(activityId, userId) {
  await assertRoomAccess(activityId, userId);
  const items = await ChecklistItem.find({ activity: activityId })
    .sort({ createdAt: 1 })
    .populate('assignedTo', 'name avatarUrl');
  return items.map((i) => i.toPublicJSON());
}

export async function updateItem(activityId, itemId, userId, { isDone, title, assignedTo }) {
  await assertRoomAccess(activityId, userId);

  const item = await ChecklistItem.findOne({ _id: itemId, activity: activityId });
  if (!item) {
    throw new ApiError(404, 'Checklist item not found');
  }

  if (isDone !== undefined) item.isDone = isDone;
  if (title !== undefined) item.title = title;
  if (assignedTo !== undefined) item.assignedTo = assignedTo || null;

  await item.save();
  return ChecklistItem.findById(item._id).populate('assignedTo', 'name avatarUrl');
}

export async function deleteItem(activityId, itemId, userId) {
  const { isHost } = await assertRoomAccess(activityId, userId);

  const item = await ChecklistItem.findOne({ _id: itemId, activity: activityId });
  if (!item) {
    throw new ApiError(404, 'Checklist item not found');
  }
  if (!isHost && item.createdBy.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the host or the person who added this item can delete it');
  }

  await item.deleteOne();
}
