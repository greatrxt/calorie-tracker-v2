import { Hono } from "hono";
import type { Env } from "../types";

export const favoriteRoutes = new Hono<{ Bindings: Env }>();

favoriteRoutes.get("/", async (c) => {
  const userId = c.get("userId" as never) as number;

  const result = await c.env.DB.prepare(
    "SELECT * FROM favorites WHERE user_id = ? ORDER BY use_count DESC, created_at DESC"
  ).bind(userId).all();

  return c.json({ success: true, favorites: result.results || [] });
});

favoriteRoutes.post("/", async (c) => {
  const userId = c.get("userId" as never) as number;
  const { name, meal_type, items, total_calories, total_protein, total_carbs, total_fat } = await c.req.json();

  if (!name || !items) {
    return c.json({ success: false, message: "Name and items required" }, 400);
  }

  await c.env.DB.prepare(
    `INSERT INTO favorites (user_id, name, meal_type, items_json, total_calories, total_protein, total_carbs, total_fat)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    userId, name, meal_type || "snack", JSON.stringify(items),
    total_calories || 0, total_protein || 0, total_carbs || 0, total_fat || 0
  ).run();

  return c.json({ success: true, message: "Favorite saved" });
});

favoriteRoutes.post("/:id/log", async (c) => {
  const userId = c.get("userId" as never) as number;
  const favId = parseInt(c.req.param("id"), 10);

  const fav = await c.env.DB.prepare(
    "SELECT * FROM favorites WHERE id = ? AND user_id = ?"
  ).bind(favId, userId).first<{
    id: number; meal_type: string; items_json: string;
  }>();

  if (!fav) {
    return c.json({ success: false, message: "Favorite not found" }, 404);
  }

  const items = JSON.parse(fav.items_json) as Array<{
    name: string; quantity: number; unit: string;
    calories: number; protein: number; carbs: number; fat: number;
  }>;
  const now = new Date().toISOString();

  for (const item of items) {
    await c.env.DB.prepare(
      `INSERT INTO meals (user_id, meal_type, name, quantity, unit, calories, protein, carbs, fat, timestamp, original_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      userId, fav.meal_type, item.name, item.quantity, item.unit,
      item.calories, item.protein, item.carbs, item.fat, now, "[Favorite]"
    ).run();
  }

  // Increment use count
  await c.env.DB.prepare(
    "UPDATE favorites SET use_count = use_count + 1 WHERE id = ?"
  ).bind(favId).run();

  return c.json({ success: true, message: "Favorite logged" });
});

favoriteRoutes.delete("/:id", async (c) => {
  const userId = c.get("userId" as never) as number;
  const favId = parseInt(c.req.param("id"), 10);

  await c.env.DB.prepare(
    "DELETE FROM favorites WHERE id = ? AND user_id = ?"
  ).bind(favId, userId).run();

  return c.json({ success: true, message: "Favorite deleted" });
});
