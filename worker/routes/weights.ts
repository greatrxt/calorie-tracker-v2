import { Hono } from "hono";
import type { Env } from "../types";

export const weightRoutes = new Hono<{ Bindings: Env }>();

weightRoutes.get("/latest", async (c) => {
  const userId = c.get("userId" as never) as number;
  const weight = await c.env.DB.prepare(
    "SELECT id, weight as weight_kg, original_text, timestamp FROM weights WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1"
  ).bind(userId).first();

  if (!weight) {
    return c.json({ success: true, data: null });
  }
  return c.json({ success: true, data: weight });
});

weightRoutes.get("/:id", async (c) => {
  const userId = c.get("userId" as never) as number;
  const weightId = parseInt(c.req.param("id"), 10);

  const weight = await c.env.DB.prepare(
    "SELECT id, weight as weight_kg, original_text, timestamp FROM weights WHERE id = ? AND user_id = ?"
  ).bind(weightId, userId).first();

  if (!weight) {
    return c.json({ success: false, message: "Weight entry not found" }, 404);
  }
  return c.json({ success: true, data: weight });
});

weightRoutes.put("/:id", async (c) => {
  const userId = c.get("userId" as never) as number;
  const weightId = parseInt(c.req.param("id"), 10);

  const existing = await c.env.DB.prepare(
    "SELECT id FROM weights WHERE id = ? AND user_id = ?"
  ).bind(weightId, userId).first();
  if (!existing) {
    return c.json({ success: false, message: "Weight entry not found" }, 404);
  }

  const data = await c.req.json();
  await c.env.DB.prepare(
    "UPDATE weights SET weight = ?, timestamp = ? WHERE id = ? AND user_id = ?"
  ).bind(data.weight_kg, data.timestamp, weightId, userId).run();

  return c.json({ success: true, message: "Weight updated" });
});

weightRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId" as never) as number;
  const weightId = parseInt(c.req.param("id"), 10);

  const existing = await c.env.DB.prepare(
    "SELECT id FROM weights WHERE id = ? AND user_id = ?"
  ).bind(weightId, userId).first();
  if (!existing) {
    return c.json({ success: false, message: "Weight entry not found" }, 404);
  }

  await c.env.DB.prepare(
    "DELETE FROM weights WHERE id = ? AND user_id = ?"
  ).bind(weightId, userId).run();

  return c.json({ success: true, message: "Weight deleted" });
});
