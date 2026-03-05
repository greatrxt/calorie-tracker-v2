import { Hono } from "hono";
import type { Env } from "../types";

export const historyRoutes = new Hono<{ Bindings: Env }>();

historyRoutes.get("/", async (c) => {
  const userId = c.get("userId" as never) as number;
  const page = parseInt(c.req.query("page") || "1", 10);
  const perPage = parseInt(c.req.query("per_page") || "20", 10);
  const offset = (page - 1) * perPage;

  const meals = await c.env.DB.prepare(
    `SELECT id, meal_type, name, quantity, unit, calories, protein, carbs, fat, photo_url, timestamp, original_text, 'meal' as type
     FROM meals WHERE user_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?`
  ).bind(userId, perPage, offset).all();

  const weights = await c.env.DB.prepare(
    `SELECT id, weight as weight_kg, timestamp, original_text, 'weight' as type
     FROM weights WHERE user_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?`
  ).bind(userId, perPage, offset).all();

  const mealsCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM meals WHERE user_id = ?"
  ).bind(userId).first<{ count: number }>();

  const weightsCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM weights WHERE user_id = ?"
  ).bind(userId).first<{ count: number }>();

  const total = Math.max(mealsCount?.count || 0, weightsCount?.count || 0);
  const hasNext = offset + perPage < total;

  return c.json({
    success: true,
    data: {
      meals: meals.results || [],
      weights: weights.results || [],
      has_next: hasNext,
      page,
    },
  });
});

historyRoutes.get("/stats", async (c) => {
  const userId = c.get("userId" as never) as number;
  const today = new Date().toISOString().slice(0, 10);

  // Today's calories
  const todayCalories = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(calories), 0) as total FROM meals WHERE user_id = ? AND timestamp LIKE ?"
  ).bind(userId, `${today}%`).first<{ total: number }>();

  // Today's macros
  const todayMacros = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(protein), 0) as protein, COALESCE(SUM(carbs), 0) as carbs, COALESCE(SUM(fat), 0) as fat FROM meals WHERE user_id = ? AND timestamp LIKE ?"
  ).bind(userId, `${today}%`).first<{ protein: number; carbs: number; fat: number }>();

  // Latest weight
  const latestWeight = await c.env.DB.prepare(
    "SELECT weight as weight_kg, timestamp FROM weights WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1"
  ).bind(userId).first<{ weight_kg: number; timestamp: string }>();

  // Today's water
  const todayWater = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(amount_ml), 0) as total_ml FROM water_intake WHERE user_id = ? AND timestamp LIKE ?"
  ).bind(userId, `${today}%`).first<{ total_ml: number }>();

  // Streak: count consecutive days with at least one meal entry
  const streakResult = await c.env.DB.prepare(
    `SELECT DISTINCT DATE(timestamp) as day FROM meals WHERE user_id = ? ORDER BY day DESC LIMIT 60`
  ).bind(userId).all<{ day: string }>();

  let streak = 0;
  if (streakResult.results) {
    const days = streakResult.results.map((r) => r.day);
    const todayDate = new Date(today);
    for (let i = 0; i < days.length; i++) {
      const expected = new Date(todayDate);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().slice(0, 10);
      if (days[i] === expectedStr) {
        streak++;
      } else {
        break;
      }
    }
  }

  // User calorie goal
  const user = await c.env.DB.prepare(
    "SELECT calorie_goal, unit_preference FROM users WHERE id = ?"
  ).bind(userId).first<{ calorie_goal: number; unit_preference: string }>();

  // Last 30 days calories
  const last30 = await c.env.DB.prepare(
    `SELECT DATE(timestamp) as day, SUM(calories) as total
     FROM meals WHERE user_id = ? AND timestamp >= DATE('now', '-30 days')
     GROUP BY DATE(timestamp) ORDER BY day ASC`
  ).bind(userId).all<{ day: string; total: number }>();

  // Weight history (last 90 days)
  const weightHistory = await c.env.DB.prepare(
    `SELECT weight as weight_kg, DATE(timestamp) as day
     FROM weights WHERE user_id = ? AND timestamp >= DATE('now', '-90 days')
     ORDER BY timestamp ASC`
  ).bind(userId).all<{ weight_kg: number; day: string }>();

  return c.json({
    success: true,
    data: {
      today_calories: todayCalories?.total || 0,
      today_protein: todayMacros?.protein || 0,
      today_carbs: todayMacros?.carbs || 0,
      today_fat: todayMacros?.fat || 0,
      latest_weight: latestWeight,
      today_water_ml: todayWater?.total_ml || 0,
      streak,
      calorie_goal: user?.calorie_goal || 2000,
      unit_preference: user?.unit_preference || "metric",
      daily_calories: last30.results || [],
      weight_history: weightHistory.results || [],
    },
  });
});
