import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { authRouter } from "./routes/auth.routes.js";
import { groupRouter } from "./routes/group.routes.js";
import { expenseRouter } from "./routes/expense.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  // ✅ Fix for __dirname in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // ✅ CORS setup
  const rawOrigins = (process.env.CORS_ORIGIN || "").trim();
  const allowlist = rawOrigins
    ? rawOrigins.split(",").map((s) => s.trim()).filter(Boolean)
    : ["http://localhost:5173", "http://127.0.0.1:5173"];

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowlist.includes("*")) return cb(null, true);
        return cb(null, allowlist.includes(origin));
      },
      credentials: true,
    })
  );

  // ✅ Middlewares
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  // ✅ Health check
  app.get("/health", (_req, res) => res.json({ ok: true }));

  // ✅ API routes
  app.use("/api/auth", authRouter);
  app.use("/api/groups", groupRouter);
  app.use("/api/groups", expenseRouter);

  // ✅ Serve frontend (IMPORTANT)
  app.use(express.static(path.join(__dirname, "../dist")));

  // ✅ Catch-all route for React (FIXES REFRESH ISSUE)
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });

  // ✅ Error handler (keep last)
  app.use(errorHandler);

  return app;
}