import { Expense } from '../models/Expense.js';
import { ApiError } from '../utils/ApiError.js';
import { assertRoomAccess, listMembers } from './room.service.js';

export async function createExpense(activityId, userId, { description, amount, currency, paidBy, splitBetween }) {
  const { activity } = await assertRoomAccess(activityId, userId);
  if (activity.status === 'cancelled') {
    throw new ApiError(400, 'Cannot add expenses for a cancelled activity');
  }

  const expense = await Expense.create({
    activity: activityId,
    description,
    amount,
    currency,
    paidBy: paidBy || userId,
    splitBetween: splitBetween || [],
    createdBy: userId,
  });

  return Expense.findById(expense._id).populate('paidBy', 'name avatarUrl').populate('splitBetween', 'name avatarUrl');
}

export async function listExpenses(activityId, userId) {
  const { isHost } = await assertRoomAccess(activityId, userId);

  const expenses = await Expense.find({ activity: activityId })
    .sort({ createdAt: -1 })
    .populate('paidBy', 'name avatarUrl')
    .populate('splitBetween', 'name avatarUrl');

  const { host, members } = await listMembers(activityId, userId);
  const allMemberIds = [host._id.toString(), ...members.map((m) => m._id.toString())];
  const nameById = new Map([[host._id.toString(), host.name], ...members.map((m) => [m._id.toString(), m.name])]);

  const balances = computeBalances(expenses, allMemberIds);
  const settlements = simplifySettlements(balances);

  return {
    expenses: expenses.map((e) => e.toPublicJSON()),
    balances: Object.entries(balances).map(([userIdKey, amount]) => ({
      user: { id: userIdKey, name: nameById.get(userIdKey) },
      netBalance: Math.round(amount * 100) / 100,
    })),
    settlements: settlements.map((s) => ({
      from: { id: s.from, name: nameById.get(s.from) },
      to: { id: s.to, name: nameById.get(s.to) },
      amount: Math.round(s.amount * 100) / 100,
    })),
    isHost,
  };
}

export async function deleteExpense(activityId, expenseId, userId) {
  const { isHost } = await assertRoomAccess(activityId, userId);

  const expense = await Expense.findOne({ _id: expenseId, activity: activityId });
  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }
  if (!isHost && expense.createdBy.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the host or the person who logged this expense can delete it');
  }

  await expense.deleteOne();
}

function computeBalances(expenses, allMemberIds) {
  const balances = Object.fromEntries(allMemberIds.map((id) => [id, 0]));

  for (const expense of expenses) {
    if (!expense || !expense.amount) continue;
    const payerId = expense.paidBy?._id ? expense.paidBy._id.toString() : (expense.paidBy ? expense.paidBy.toString() : null);
    if (!payerId) continue;

    const validSplit = (expense.splitBetween || [])
      .filter((u) => Boolean(u))
      .map((u) => (u._id ? u._id.toString() : u.toString()));

    const splitIds = validSplit.length ? validSplit : allMemberIds;
    const share = expense.amount / (splitIds.length || 1);

    balances[payerId] = (balances[payerId] || 0) + expense.amount;
    for (const id of splitIds) {
      balances[id] = (balances[id] || 0) - share;
    }
  }

  return balances;
}

// Greedy debt simplification: match the biggest creditor with the biggest
// debtor repeatedly, minimizing the number of payments needed to settle up.
function simplifySettlements(balances) {
  const creditors = [];
  const debtors = [];

  for (const [id, amount] of Object.entries(balances)) {
    if (amount > 0.01) creditors.push({ id, amount });
    else if (amount < -0.01) debtors.push({ id, amount: -amount });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const payment = Math.min(debtors[i].amount, creditors[j].amount);
    settlements.push({ from: debtors[i].id, to: creditors[j].id, amount: payment });

    debtors[i].amount -= payment;
    creditors[j].amount -= payment;

    if (debtors[i].amount < 0.01) i += 1;
    if (creditors[j].amount < 0.01) j += 1;
  }

  return settlements;
}
