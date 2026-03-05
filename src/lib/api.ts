const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data as T;
}

// Auth
export const api = {
  login: (email: string, password: string) =>
    request<{ success: boolean; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ usernameOrEmail: email, password }),
    }),

  register: (username: string, email: string, password: string) =>
    request<{ success: boolean; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),

  getGoogleAuthUrl: () =>
    request<{ success: boolean; url: string }>("/auth/google"),

  // User
  getProfile: () =>
    request<{ success: boolean; data: UserProfile }>("/me"),

  updateProfile: (data: Partial<UserProfile>) =>
    request<{ success: boolean }>("/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Entries (AI parsing)
  parseText: (text: string) =>
    request<{ success: boolean; entries: ParsedEntry[] }>("/entries/text", {
      method: "POST",
      body: JSON.stringify({ entry_text: text, current_time: new Date().toISOString() }),
    }),

  parsePhoto: (base64: string) =>
    request<{ success: boolean; entries: ParsedEntry[] }>("/entries/photo", {
      method: "POST",
      body: JSON.stringify({ image: base64, current_time: new Date().toISOString() }),
    }),

  previewEntry: (text: string) =>
    request<{ success: boolean; entries: ParsedEntry[]; data: unknown }>("/entries/preview", {
      method: "POST",
      body: JSON.stringify({ entry_text: text, current_time: new Date().toISOString() }),
    }),

  // Meals
  getTodayMeals: () =>
    request<{ success: boolean; meals: Meal[] }>("/meals/today"),

  getRecentMeals: () =>
    request<{ success: boolean; meals: Meal[] }>("/meals/recent"),

  getMeal: (id: number) =>
    request<{ success: boolean; data: Meal }>(`/meals/${id}`),

  updateMeal: (id: number, data: Partial<Meal>) =>
    request<{ success: boolean }>(`/meals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteMeal: (id: number) =>
    request<{ success: boolean }>(`/meals/${id}`, { method: "DELETE" }),

  // Weights
  getLatestWeight: () =>
    request<{ success: boolean; data: Weight | null }>("/weights/latest"),

  getWeight: (id: number) =>
    request<{ success: boolean; data: Weight }>(`/weights/${id}`),

  updateWeight: (id: number, data: Partial<Weight>) =>
    request<{ success: boolean }>(`/weights/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteWeight: (id: number) =>
    request<{ success: boolean }>(`/weights/${id}`, { method: "DELETE" }),

  // Water
  getTodayWater: () =>
    request<{ success: boolean; total_ml: number }>("/water/today"),

  addWater: (amount_ml: number) =>
    request<{ success: boolean }>("/water/quick", {
      method: "POST",
      body: JSON.stringify({ amount_ml }),
    }),

  // History
  getHistory: (page: number = 1) =>
    request<{
      success: boolean;
      data: { meals: Meal[]; weights: Weight[]; has_next: boolean; page: number };
    }>(`/history?page=${page}`),

  getStats: () =>
    request<{ success: boolean; data: DashboardStats }>("/history/stats"),

  // Favorites
  getFavorites: () =>
    request<{ success: boolean; favorites: Favorite[] }>("/favorites"),

  addFavorite: (data: {
    name: string;
    meal_type: string;
    items: ParsedEntry[];
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
  }) =>
    request<{ success: boolean }>("/favorites", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logFavorite: (id: number) =>
    request<{ success: boolean }>(`/favorites/${id}/log`, { method: "POST" }),

  deleteFavorite: (id: number) =>
    request<{ success: boolean }>(`/favorites/${id}`, { method: "DELETE" }),
};

// Types
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  calorie_goal: number;
  unit_preference: string;
  height: number | null;
  weight_goal: number | null;
  age: number | null;
  gender: string | null;
  activity_level: string | null;
}

export interface ParsedEntry {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_type?: string;
  entry_type?: string;
  weight_kg?: number;
  amount_ml?: number;
}

export interface Meal {
  id: number;
  meal_type: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photo_url: string | null;
  timestamp: string;
  original_text: string;
  type?: string;
}

export interface Weight {
  id: number;
  weight_kg: number;
  timestamp: string;
  original_text: string;
  type?: string;
}

export interface DashboardStats {
  today_calories: number;
  today_protein: number;
  today_carbs: number;
  today_fat: number;
  latest_weight: { weight_kg: number; timestamp: string } | null;
  today_water_ml: number;
  streak: number;
  calorie_goal: number;
  unit_preference: string;
  daily_calories: { day: string; total: number }[];
  weight_history: { weight_kg: number; day: string }[];
}

export interface Favorite {
  id: number;
  name: string;
  meal_type: string;
  items_json: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  use_count: number;
  created_at: string;
}
