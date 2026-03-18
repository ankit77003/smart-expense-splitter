import mongoose from "mongoose";
import { z } from "zod";

import { Group } from "../models/Group.js";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";

const createGroupSchema = z.object({
  name: z.string().min(1).max(120),
  memberEmails: z.array(z.string().email()).default([]),
});

const addMembersSchema = z.object({
  memberEmails: z.array(z.string().email()).min(1),
});

export async function listGroups(userId) {
  return Group.find({ members: userId }).sort({ createdAt: -1 }).lean();
}

export async function getGroup(groupId, userId) {
  if (!mongoose.isValidObjectId(groupId)) throw new HttpError(400, "Invalid group id");
  const group = await Group.findById(groupId).populate("members", "name email").lean();
  if (!group) throw new HttpError(404, "Group not found");
  const isMember = group.members.some((m) => String(m._id) === String(userId));
  if (!isMember) throw new HttpError(403, "Not a member of this group");
  return group;
}

export async function createGroup(input, userId) {
  const data = createGroupSchema.parse(input);

  const emails = new Set([...(data.memberEmails || []), String((await User.findById(userId))?.email || "")].filter(Boolean));
  const users = await User.find({ email: { $in: [...emails].map((e) => e.toLowerCase()) } }).lean();
  const memberIds = new Set(users.map((u) => String(u._id)));
  memberIds.add(String(userId));

  const group = await Group.create({
    name: data.name,
    createdBy: userId,
    members: [...memberIds].map((id) => new mongoose.Types.ObjectId(id)),
  });
  return group.toObject();
}

export async function addMembers(groupId, input, userId) {
  if (!mongoose.isValidObjectId(groupId)) throw new HttpError(400, "Invalid group id");
  const data = addMembersSchema.parse(input);

  const group = await Group.findById(groupId);
  if (!group) throw new HttpError(404, "Group not found");
  if (!group.members.some((m) => String(m) === String(userId))) throw new HttpError(403, "Not a member of this group");

  const users = await User.find({ email: { $in: data.memberEmails.map((e) => e.toLowerCase()) } });
  if (users.length === 0) throw new HttpError(400, "No users found for provided emails");

  const newIds = users.map((u) => String(u._id));
  const merged = new Set(group.members.map((m) => String(m)));
  newIds.forEach((id) => merged.add(id));
  group.members = [...merged].map((id) => new mongoose.Types.ObjectId(id));
  await group.save();

  return Group.findById(groupId).populate("members", "name email").lean();
}

