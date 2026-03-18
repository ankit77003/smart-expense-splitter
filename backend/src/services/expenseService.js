import mongoose from "mongoose";
import { z } from "zod";

import { Group } from "../models/Group.js";
import { Expense } from "../models/Expense.js";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";

const addExpenseSchema = z.object({
  description: z.string().max(240).optional().default(""),
  amount: z.number().positive(),
  payerId: z.string(),
  participantIds: z.array(z.string()).min(1),
  splitType: z.enum(["EQUAL", "CUSTOM"]).optional().default("EQUAL"),
  customShares: z.record(z.string(), z.number().nonnegative()).optional(),
});

async function assertGroupMember(groupId, userId) {
  if (!mongoose.isValidObjectId(groupId)) throw new HttpError(400, "Invalid group id");
  const group = await Group.findById(groupId).lean();
  if (!group) throw new HttpError(404, "Group not found");
  const ok = group.members.some((m) => String(m) === String(userId));
  if (!ok) throw new HttpError(403, "Not a member of this group");
  return group;
}

export async function listExpenses(groupId, userId) {
  await assertGroupMember(groupId, userId);
  const expenses = await Expense.find({ group: groupId })
    .sort({ createdAt: -1 })
    .populate("payer", "name email")
    .populate("participants.user", "name email")
    .lean();
  return expenses;
}

export async function addExpense(groupId, input, userId) {
  const group = await assertGroupMember(groupId, userId);
  const data = addExpenseSchema.parse(input);

  if (!mongoose.isValidObjectId(data.payerId)) throw new HttpError(400, "Invalid payerId");
  const payerInGroup = group.members.some((m) => String(m) === String(data.payerId));
  if (!payerInGroup) throw new HttpError(400, "Payer must be a group member");

  const uniqueParticipants = [...new Set(data.participantIds)];
  if (uniqueParticipants.some((id) => !mongoose.isValidObjectId(id))) throw new HttpError(400, "Invalid participant id");
  const allInGroup = uniqueParticipants.every((id) => group.members.some((m) => String(m) === String(id)));
  if (!allInGroup) throw new HttpError(400, "All participants must be group members");

  let participants;
  if (data.splitType === "CUSTOM") {
    const shares = data.customShares || {};
    const total = uniqueParticipants.reduce((sum, id) => sum + Number(shares[id] || 0), 0);
    if (Math.abs(total - data.amount) > 0.01) throw new HttpError(400, "Custom shares must sum to total amount");
    participants = uniqueParticipants.map((id) => ({ user: id, share: Number(shares[id] || 0) }));
  } else {
    const share = Number((data.amount / uniqueParticipants.length).toFixed(2));
    participants = uniqueParticipants.map((id) => ({ user: id, share }));
    const delta = Number((data.amount - share * uniqueParticipants.length).toFixed(2));
    if (Math.abs(delta) >= 0.01) participants[0].share = Number((participants[0].share + delta).toFixed(2));
  }

  const payer = await User.findById(data.payerId).lean();
  if (!payer) throw new HttpError(400, "Payer not found");

  const expense = await Expense.create({
    group: groupId,
    description: data.description || "",
    amount: data.amount,
    payer: data.payerId,
    participants,
    splitType: data.splitType,
    createdBy: userId,
  });

  return Expense.findById(expense._id)
    .populate("payer", "name email")
    .populate("participants.user", "name email")
    .lean();
}

