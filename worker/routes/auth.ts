import { Hono } from "hono";
import type { Env } from "../types";
import { hashPassword, generateSalt, verifyPassword } from "../utils/password";
import { createJwt } from "../utils/jwt";

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post("/register", async (c) => {
  try {
    const { username, email, password } = await c.req.json();
    if (!username || !email || !password) {
      return c.json({ success: false, message: "All fields are required" }, 400);
    }

    const existing = await c.env.DB.prepare(
      "SELECT id FROM users WHERE username = ? OR email = ?"
    ).bind(username, email).first();
    if (existing) {
      return c.json({ success: false, message: "Username or email already exists" }, 400);
    }

    const salt = generateSalt();
    const saltB64 = btoa(String.fromCharCode(...salt));
    const passwordHash = await hashPassword(password, salt);

    await c.env.DB.prepare(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)"
    ).bind(username, email, `${saltB64}$${passwordHash}`).run();

    return c.json({ success: true, message: "Registration successful" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.json({ success: false, message: `Registration error: ${message}` }, 500);
  }
});

authRoutes.post("/login", async (c) => {
  try {
    const { usernameOrEmail, password } = await c.req.json();
    if (!usernameOrEmail || !password) {
      return c.json({ success: false, message: "All fields are required" }, 400);
    }

    const user = await c.env.DB.prepare(
      "SELECT id, username, password_hash FROM users WHERE username = ? OR email = ?"
    ).bind(usernameOrEmail, usernameOrEmail).first<{
      id: number; username: string; password_hash: string;
    }>();

    if (!user) {
      return c.json({ success: false, message: "Invalid credentials" }, 401);
    }

    const [saltB64, storedHash] = user.password_hash.split("$");
    if (!saltB64 || !storedHash) {
      return c.json({ success: false, message: "Corrupted password data" }, 500);
    }

    const salt = new Uint8Array(Array.from(atob(saltB64)).map((ch) => ch.charCodeAt(0)));
    const isValid = await verifyPassword(password, salt, storedHash);
    if (!isValid) {
      return c.json({ success: false, message: "Invalid credentials" }, 401);
    }

    const token = await createJwt({ user_id: user.id, username: user.username }, c.env.JWT_SECRET);
    return c.json({ success: true, token, username: user.username });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.json({ success: false, message: `Login error: ${message}` }, 500);
  }
});

authRoutes.get("/google", async (c) => {
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: c.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });
  return c.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
});

authRoutes.get("/google/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) {
    return c.json({ success: false, message: "Missing code" }, 400);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: c.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    return c.json({ success: false, message: "Failed to get access token" }, 400);
  }

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = (await userRes.json()) as { email?: string; name?: string };
  if (!userData.email) {
    return c.json({ success: false, message: "Failed to get user info" }, 400);
  }

  let user = await c.env.DB.prepare(
    "SELECT id, username FROM users WHERE email = ?"
  ).bind(userData.email).first<{ id: number; username: string }>();

  if (!user) {
    const username = userData.name || userData.email.split("@")[0];
    await c.env.DB.prepare(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)"
    ).bind(username, userData.email, "GOOGLE_OAUTH").run();
    user = await c.env.DB.prepare(
      "SELECT id, username FROM users WHERE email = ?"
    ).bind(userData.email).first<{ id: number; username: string }>();
  }

  if (!user) {
    return c.json({ success: false, message: "Failed to create user" }, 500);
  }

  const token = await createJwt({ user_id: user.id, username: user.username }, c.env.JWT_SECRET);
  return c.json({ success: true, token, username: user.username });
});
