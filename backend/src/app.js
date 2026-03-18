import express from "express";
import cors from "cors";
import morgan from "morgan";

import { authRouter } from "./routes/auth.routes.js";
import { groupRouter } from "./routes/group.routes.js";
import { expenseRouter } from "./routes/expense.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  const rawOrigins = (process.env.CORS_ORIGIN || "").trim();
  const allowlist = rawOrigins
    ? rawOrigins.split(",").map((s) => s.trim()).filter(Boolean)
    : ["http://localhost:5173", "http://127.0.0.1:5173"];

  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow non-browser tools (curl/postman) with no Origin header.
        if (!origin) return cb(null, true);
        if (allowlist.includes("*")) return cb(null, true);
        return cb(null, allowlist.includes(origin));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/groups", groupRouter);
  app.use("/api/groups", expenseRouter);

  app.use(errorHandler);

  return app;
}

