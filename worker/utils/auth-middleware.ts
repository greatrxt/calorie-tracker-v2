import { createMiddleware } from "hono/factory";
import type { Env } from "../types";
import { verifyJwt } from "./jwt";

export const authMiddleware = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }

    const token = authHeader.slice(7);
    const payload = await verifyJwt(token, c.env.JWT_SECRET);
    if (!payload?.user_id) {
      return c.json(
        { success: false, message: "Invalid or expired token" },
        401
      );
    }

    c.set("userId" as never, payload.user_id);
    c.set("username" as never, payload.username);
    await next();
  }
);
