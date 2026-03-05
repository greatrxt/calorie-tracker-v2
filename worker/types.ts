export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  OPENAI_API_KEY: string;
  JWT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
}

export interface JwtPayload {
  user_id: number;
  username: string;
  exp: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  calorie_goal: number;
  unit_preference: string;
}
