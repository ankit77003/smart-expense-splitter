import { Router } from "express";
import { register, login } from "../services/authService.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const result = await register(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const result = await login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

