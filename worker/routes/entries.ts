import { Hono } from "hono";
import type { Env } from "../types";
import { parseEntryWithAI, parsePhotoWithAI } from "./openai";

export const entryRoutes = new Hono<{ Bindings: Env }>();

// Text-based entry
entryRoutes.post("/text", async (c) => {
  const userId = c.get("userId" as never) as number;
  const { entry_text, current_time } = await c.req.json();
  const time = current_time || new Date().toISOString();

  if (!entry_text) {
    return c.json({ success: false, message: "Entry text is required" }, 400);
  }

  const parsed = await parseEntryWithAI(entry_text, time, c.env);
  if (!parsed.success || !parsed.result) {
    return c.json({ success: false, message: parsed.message || "Failed to parse entry" }, 400);
  }

  const result = parsed.result as Record<string, unknown>;
  return await saveEntry(c.env, userId, result, entry_text);
});

// Photo-based entry
entryRoutes.post("/photo", async (c) => {
  const userId = c.get("userId" as never) as number;
  const formData = await c.req.formData();
  const photo = formData.get("photo") as File | null;
  const currentTime = (formData.get("current_time") as string) || new Date().toISOString();

  if (!photo) {
    return c.json({ success: false, message: "Photo is required" }, 400);
  }

  // Convert to base64
  const buffer = await photo.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

  // Parse with AI
  const parsed = await parsePhotoWithAI(base64, currentTime, c.env);
  if (!parsed.success || !parsed.result) {
    return c.json({ success: false, message: parsed.message || "Failed to parse photo" }, 400);
  }

  // Store photo in R2
  const photoKey = `meals/${userId}/${Date.now()}-${photo.name || "photo.jpg"}`;
  await c.env.R2.put(photoKey, buffer, {
    httpMetadata: { contentType: photo.type || "image/jpeg" },
  });

  const result = parsed.result as Record<string, unknown>;
  return await saveEntry(c.env, userId, result, `[Photo: ${photo.name}]`, photoKey);
});

// Preview endpoint - parse without saving
entryRoutes.post("/preview", async (c) => {
  const { entry_text, current_time } = await c.req.json();
  const time = current_time || new Date().toISOString();

  if (!entry_text) {
    return c.json({ success: false, message: "Entry text is required" }, 400);
  }

  const parsed = await parseEntryWithAI(entry_text, time, c.env);
  if (!parsed.success) {
    return c.json({ success: false, message: parsed.message }, 400);
  }

  return c.json({ success: true, data: parsed.result });
});

async function saveEntry(
  env: Env,
  userId: number,
  result: Record<string, unknown>,
  originalText: string,
  photoKey?: string
) {
  const entryType = result.entry_type as string;

  if (entryType === "meal") {
    const foodItems = result.food_items as Array<Record<string, unknown>>;
    const mealType = result.meal_type as string;
    const suggestedTime = result.suggested_time as string;
    const savedMeals = [];

    for (const item of foodItems) {
      await env.DB.prepare(
        `INSERT INTO meals (user_id, meal_type, name, quantity, unit, calories, protein, carbs, fat, photo_url, timestamp, original_text)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        userId, mealType, item.name, item.quantity, item.unit,
        item.calories || 0, item.protein || 0, item.carbs || 0, item.fat || 0,
        photoKey || null, suggestedTime, originalText
      ).run();

      savedMeals.push(item);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Meal logged! Added ${foodItems.length} item(s).`,
      data: { entry_type: "meal", meals: savedMeals, meal_type: mealType },
    }), { headers: { "Content-Type": "application/json" } });
  }

  if (entryType === "weight") {
    const weightKg = result.weight_kg as number;
    const suggestedTime = (result.suggested_time as string) || new Date().toISOString();

    await env.DB.prepare(
      "INSERT INTO weights (user_id, weight, timestamp, original_text) VALUES (?, ?, ?, ?)"
    ).bind(userId, weightKg, suggestedTime, originalText).run();

    return new Response(JSON.stringify({
      success: true,
      message: `Weight logged: ${weightKg} kg`,
      data: { entry_type: "weight", weight_kg: weightKg },
    }), { headers: { "Content-Type": "application/json" } });
  }

  if (entryType === "water") {
    const amountMl = result.amount_ml as number;
    const suggestedTime = (result.suggested_time as string) || new Date().toISOString();

    await env.DB.prepare(
      "INSERT INTO water_intake (user_id, amount_ml, timestamp) VALUES (?, ?, ?)"
    ).bind(userId, amountMl, suggestedTime).run();

    return new Response(JSON.stringify({
      success: true,
      message: `Water logged: ${amountMl} ml`,
      data: { entry_type: "water", amount_ml: amountMl },
    }), { headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({
    success: false,
    message: "Could not understand the entry. Please try rephrasing.",
  }), { status: 400, headers: { "Content-Type": "application/json" } });
}
