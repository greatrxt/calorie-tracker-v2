import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import { authRoutes } from "./routes/auth";
import { entryRoutes } from "./routes/entries";
import { mealRoutes } from "./routes/meals";
import { weightRoutes } from "./routes/weights";
import { waterRoutes } from "./routes/water";
import { historyRoutes } from "./routes/history";
import { userRoutes } from "./routes/user";
import { favoriteRoutes } from "./routes/favorites";
import { authMiddleware } from "./utils/auth-middleware";

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", cors());

// Public routes
app.route("/api/auth", authRoutes);

// Protected routes
app.use("/api/me/*", authMiddleware);
app.use("/api/entries/*", authMiddleware);
app.use("/api/meals/*", authMiddleware);
app.use("/api/weights/*", authMiddleware);
app.use("/api/water/*", authMiddleware);
app.use("/api/history/*", authMiddleware);
app.use("/api/favorites/*", authMiddleware);

app.route("/api/me", userRoutes);
app.route("/api/entries", entryRoutes);
app.route("/api/meals", mealRoutes);
app.route("/api/weights", weightRoutes);
app.route("/api/water", waterRoutes);
app.route("/api/history", historyRoutes);
app.route("/api/favorites", favoriteRoutes);

// Health check
app.get("/api/health", (c) => c.json({ ok: true }));

export default app;
