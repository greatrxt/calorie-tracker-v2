import { Hono } from "hono";
import type { Env } from "../types";

export const mealRoutes = new Hono<{ Bindings: Env }>();

mealRoutes.get("/today", async (c) => {
  const userId = c.get("userId" as never) as number;
  const today = new Date().toISOString().slice(0, 10);

  const result = await c.env.DB.prepare(
    `SELECT id, meal_type, name, quantity, unit, calories, protein, carbs, fat, photo_url, timestamp, original_text
     FROM meals WHERE user_id = ? AND timestamp LIKE ? ORDER BY timestamp ASC`
  ).bind(userId, `${today}%`).all();

  return c.json({ success: true, meals: result.results || [] });
});

mealRoutes.get("/recent", async (c) => {
  const userId = c.get("userId" as never) as number;

  const result = await c.env.DB.prepare(
    `SELECT id, meal_type, name, quantity, unit, calories, protein, carbs, fat, photo_url, timestamp, original_text
     FROM meals WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20`
  ).bind(userId).all();

  return c.json({ success: true, meals: result.results || [] });
});

mealRoutes.get("/:id", async (c) => {
  const userId = c.get("userId" as never) as number;
  const mealId = parseInt(c.req.param("id"), 10);

  const meal = await c.env.DB.prepare(
    `SELECT id, meal_type, name, quantity, unit, calories, protein, carbs, fat, photo_url, timestamp, original_text
     FROM meals WHERE id = ? AND user_id = ?`
  ).bind(mealId, userId).first();

  if (!meal) {
    return c.json({ success: false, message: "Meal not found" }, 404);
  }
  return c.json({ success: true, data: meal });
});

mealRoutes.put("/:id", async (c) => {
  const userId = c.get("userId" as never) as number;
  const mealId = parseInt(c.req.param("id"), 10);

  const existing = await c.env.DB.prepare(
    "SELECT id FROM meals WHERE id = ? AND user_id = ?"
  ).bind(mealId, userId).first();
  if (!existing) {
    return c.json({ success: false, message: "Meal not found" }, 404);
  }

  const data = await c.req.json();
  await c.env.DB.prepare(
    `UPDATE meals SET meal_type = ?, name = ?, quantity = ?, unit = ?, calories = ?, protein = ?, carbs = ?, fat = ?, timestamp = ?
     WHERE id = ? AND user_id = ?`
  ).bind(
    data.meal_type, data.name, data.quantity, data.unit,
    data.calories, data.protein || 0, data.carbs || 0, data.fat || 0,
    data.timestamp, mealId, userId
  ).run();

  return c.json({ success: true, message: "Meal updated" });
});

mealRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId" as never) as number;
  const mealId = parseInt(c.req.param("id"), 10);

  const existing = await c.env.DB.prepare(
    "SELECT id FROM meals WHERE id = ? AND user_id = ?"
  ).bind(mealId, userId).first();
  if (!existing) {
    return c.json({ success: false, message: "Meal not found" }, 404);
  }

  await c.env.DB.prepare(
    "DELETE FROM meals WHERE id = ? AND user_id = ?"
  ).bind(mealId, userId).run();

  return c.json({ success: true, message: "Meal deleted" });
});
