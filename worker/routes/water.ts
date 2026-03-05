import { Hono } from "hono";
import type { Env } from "../types";

export const waterRoutes = new Hono<{ Bindings: Env }>();

waterRoutes.get("/today", async (c) => {
  const userId = c.get("userId" as never) as number;
  const today = new Date().toISOString().slice(0, 10);

  const result = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(amount_ml), 0) as total_ml FROM water_intake WHERE user_id = ? AND timestamp LIKE ?"
  ).bind(userId, `${today}%`).first<{ total_ml: number }>();

  return c.json({ success: true, total_ml: result?.total_ml || 0 });
});

waterRoutes.post("/quick", async (c) => {
  const userId = c.get("userId" as never) as number;
  const { amount_ml } = await c.req.json();

  if (!amount_ml || amount_ml <= 0) {
    return c.json({ success: false, message: "Invalid amount" }, 400);
  }

  await c.env.DB.prepare(
    "INSERT INTO water_intake (user_id, amount_ml, timestamp) VALUES (?, ?, ?)"
  ).bind(userId, amount_ml, new Date().toISOString()).run();

  return c.json({ success: true, message: `Added ${amount_ml} ml of water` });
});
