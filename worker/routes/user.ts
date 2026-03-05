import { Hono } from "hono";
import type { Env } from "../types";

export const userRoutes = new Hono<{ Bindings: Env }>();

userRoutes.get("/", async (c) => {
  const userId = c.get("userId" as never) as number;

  const user = await c.env.DB.prepare(
    "SELECT id, username, email, calorie_goal, unit_preference, height, weight_goal, age, gender, activity_level FROM users WHERE id = ?"
  ).bind(userId).first();

  if (!user) {
    return c.json({ success: false, message: "User not found" }, 404);
  }
  return c.json({ success: true, data: user });
});

userRoutes.put("/", async (c) => {
  const userId = c.get("userId" as never) as number;
  const data = await c.req.json();

  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.username !== undefined) { fields.push("username = ?"); values.push(data.username); }
  if (data.calorie_goal !== undefined) { fields.push("calorie_goal = ?"); values.push(data.calorie_goal); }
  if (data.unit_preference !== undefined) { fields.push("unit_preference = ?"); values.push(data.unit_preference); }
  if (data.height !== undefined) { fields.push("height = ?"); values.push(data.height); }
  if (data.weight_goal !== undefined) { fields.push("weight_goal = ?"); values.push(data.weight_goal); }
  if (data.age !== undefined) { fields.push("age = ?"); values.push(data.age); }
  if (data.gender !== undefined) { fields.push("gender = ?"); values.push(data.gender); }
  if (data.activity_level !== undefined) { fields.push("activity_level = ?"); values.push(data.activity_level); }

  if (fields.length === 0) {
    return c.json({ success: false, message: "No fields to update" }, 400);
  }

  values.push(userId);
  await c.env.DB.prepare(
    `UPDATE users SET ${fields.join(", ")} WHERE id = ?`
  ).bind(...values).run();

  return c.json({ success: true, message: "Profile updated" });
});
