import type { Env } from "../types";

const SYSTEM_PROMPT = `You are a nutrition and weight tracking assistant. Parse the user's natural language input and determine if it's about food/meals, weight tracking, or water intake.

For FOOD/MEAL entries, extract:
- entry_type: "meal"
- meal_type: breakfast, lunch, dinner, or snack (infer from context or current time)
  - If not specified, infer from time: 5-10:59=breakfast, 11-15:59=lunch, 16-21:59=dinner, 22-4:59=snack
- food_items: array of {name, quantity, unit, calories, protein, carbs, fat}
  - Calculate accurate nutritional data for the specific quantity
- suggested_time: YYYY-MM-DDTHH:mm:ss (no timezone suffix)
  - Handle relative references: "yesterday", "this morning", etc.

For WEIGHT entries:
- entry_type: "weight"
- weight_kg: weight in kilograms (convert from lbs if needed)
- suggested_time: YYYY-MM-DDTHH:mm:ss

For WATER entries:
- entry_type: "water"
- amount_ml: water amount in milliliters (convert from glasses/cups/oz as needed. 1 glass=250ml, 1 cup=240ml, 1 oz=30ml)
- suggested_time: YYYY-MM-DDTHH:mm:ss

IMPORTANT: Calculate calories, protein, carbs, fat accurately considering cooking methods, preparation, and portion sizes.

Always respond with valid JSON only.`;

export async function parseEntryWithAI(
  text: string,
  currentTime: string,
  env: Env
): Promise<{ success: boolean; result?: unknown; message?: string }> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `${SYSTEM_PROMPT}\n\nCurrent time is ${currentTime}` },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      return { success: false, message: `AI service error: ${res.status}` };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return { success: false, message: "Empty AI response" };
    }

    const result = JSON.parse(content);
    if (!result.entry_type) {
      return { success: false, message: "Could not understand the entry" };
    }

    return { success: true, result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message: `AI parsing failed: ${message}` };
  }
}

export async function parsePhotoWithAI(
  imageBase64: string,
  currentTime: string,
  env: Env
): Promise<{ success: boolean; result?: unknown; message?: string }> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `${SYSTEM_PROMPT}\n\nCurrent time is ${currentTime}\n\nThe user is sending a photo of food. Identify all food items visible and estimate nutritional content. Always return entry_type: "meal".`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "What food is in this photo? Parse it as a meal entry." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!res.ok) {
      return { success: false, message: `AI service error: ${res.status}` };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return { success: false, message: "Empty AI response" };
    }

    const result = JSON.parse(content);
    return { success: true, result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message: `AI photo parsing failed: ${message}` };
  }
}
