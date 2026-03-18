import mongoose from "mongoose";

import { Group } from "../models/Group.js";
import { Expense } from "../models/Expense.js";
import { HttpError } from "../utils/httpError.js";

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Build net balances per member.
 *
 * Convention:
 * - net > 0  => member should RECEIVE money (creditor)
 * - net < 0  => member should PAY money (debtor)
 *
 * For each expense:
 * - payer is credited by full amount
 * - each participant is debited by their share
 */
function computeNetByUser(expenses, memberIds) {
  const net = new Map(memberIds.map((id) => [String(id), 0]));

  for (const e of expenses) {
    const payerId = String(e.payer);
    net.set(payerId, round2((net.get(payerId) || 0) + Number(e.amount)));

    for (const p of e.participants) {
      const uid = String(p.user);
      net.set(uid, round2((net.get(uid) || 0) - Number(p.share)));
    }
  }

  // tiny rounding dust to 0
  for (const [k, v] of net.entries()) {
    if (Math.abs(v) < 0.005) net.set(k, 0);
  }
  return net;
}

/**
 * Greedy min-transaction settlement:
 * - Split into debtors (negative) and creditors (positive)
 * - Always match the largest debtor with the largest creditor
 *
 * This yields at most (N-1) transfers and is optimal for minimizing
 * number of transactions under this standard netting model.
 */
export function optimizeSettlement(netByUser) {
  const creditors = [];
  const debtors = [];

  for (const [userId, net] of netByUser.entries()) {
    if (net > 0) creditors.push({ userId, amount: net });
    else if (net < 0) debtors.push({ userId, amount: -net });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];

    const pay = round2(Math.min(d.amount, c.amount));
    if (pay > 0) transfers.push({ from: d.userId, to: c.userId, amount: pay });

    d.amount = round2(d.amount - pay);
    c.amount = round2(c.amount - pay);

    if (d.amount <= 0.005) i++;
    if (c.amount <= 0.005) j++;
  }

  return transfers;
}

export async function getSettlement(groupId, userId) {
  if (!mongoose.isValidObjectId(groupId)) throw new HttpError(400, "Invalid group id");

  const group = await Group.findById(groupId).populate("members", "name email").lean();
  if (!group) throw new HttpError(404, "Group not found");
  const isMember = group.members.some((m) => String(m._id) === String(userId));
  if (!isMember) throw new HttpError(403, "Not a member of this group");

  const expenses = await Expense.find({ group: groupId }).lean();
  const memberIds = group.members.map((m) => String(m._id));
  const netByUser = computeNetByUser(expenses, memberIds);

  const balances = group.members
    .map((m) => ({
      userId: String(m._id),
      name: m.name,
      email: m.email,
      net: round2(netByUser.get(String(m._id)) || 0),
    }))
    .sort((a, b) => b.net - a.net);

  const transfers = optimizeSettlement(netByUser);

  const memberIndex = new Map(group.members.map((m) => [String(m._id), m]));
  const transfersNamed = transfers.map((t) => ({
    ...t,
    fromName: memberIndex.get(t.from)?.name || t.from,
    toName: memberIndex.get(t.to)?.name || t.to,
  }));

  return {
    group: { id: String(group._id), name: group.name },
    balances,
    transfers: transfersNamed,
  };
}

