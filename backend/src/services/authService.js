import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";

const registerSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(200),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

function issueToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  return jwt.sign({}, secret, {
    subject: String(userId),
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export async function register(input) {
  const data = registerSchema.parse(input);
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) throw new HttpError(409, "Email already registered");

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash,
  });

  const token = issueToken(user._id);
  return { token, user: { id: user._id, name: user.name, email: user.email } };
}

export async function login(input) {
  const data = loginSchema.parse(input);
  const user = await User.findOne({ email: data.email.toLowerCase() });
  if (!user) throw new HttpError(401, "Invalid credentials");

  const ok = await bcrypt.compare(data.password, user.passwordHash);
  if (!ok) throw new HttpError(401, "Invalid credentials");

  const token = issueToken(user._id);
  return { token, user: { id: user._id, name: user.name, email: user.email } };
}

