import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api, type Favorite } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LogOut, Save, Loader2, Star, Play, Trash2, Sun, Moon, Monitor,
  Bell, BellOff, Download, Target,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import { exportMealsCSV } from "@/lib/export";

export function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [form, setForm] = useState({
    username: "",
    calorie_goal: 2000,
    height: "",
    weight_goal: "",
    age: "",
    gender: "",
    activity_level: "",
    unit_preference: "metric",
  });

  // Macro goals (stored in localStorage)
  const [macroGoals, setMacroGoals] = useState(() => {
    const saved = localStorage.getItem("macro_goals");
    return saved ? JSON.parse(saved) : { protein: 150, carbs: 250, fat: 65 };
  });

  // Reminders
  const [remindersEnabled, setRemindersEnabled] = useState(() => {
    return localStorage.getItem("reminders_enabled") === "true";
  });

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favLoading, setFavLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || "",
        calorie_goal: user.calorie_goal || 2000,
        height: user.height?.toString() || "",
        weight_goal: user.weight_goal?.toString() || "",
        age: user.age?.toString() || "",
        gender: user.gender || "",
        activity_level: user.activity_level || "",
        unit_preference: user.unit_preference || "metric",
      });
    }
  }, [user]);

  useEffect(() => {
    api.getFavorites().then((res) => {
      setFavorites(res.favorites);
      setFavLoading(false);
    }).catch(() => setFavLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile({
        username: form.username,
        calorie_goal: form.calorie_goal,
        height: form.height ? parseFloat(form.height) : undefined,
        weight_goal: form.weight_goal ? parseFloat(form.weight_goal) : undefined,
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender || undefined,
        activity_level: form.activity_level || undefined,
        unit_preference: form.unit_preference,
      } as Record<string, unknown>);
      await refreshUser();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMacroGoals = () => {
    localStorage.setItem("macro_goals", JSON.stringify(macroGoals));
    toast.success("Macro goals saved");
  };

  const toggleReminders = async () => {
    if (!remindersEnabled) {
      // Request notification permission
      if ("Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          toast.error("Notification permission denied. Enable it in your browser settings.");
          return;
        }
      } else {
        toast.error("Notifications not supported in this browser");
        return;
      }
      setRemindersEnabled(true);
      localStorage.setItem("reminders_enabled", "true");
      scheduleReminders();
      toast.success("Meal reminders enabled");
    } else {
      setRemindersEnabled(false);
      localStorage.setItem("reminders_enabled", "false");
      toast.success("Meal reminders disabled");
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportMealsCSV();
      toast.success("Data exported!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleLogFavorite = async (id: number) => {
    try {
      await api.logFavorite(id);
      toast.success("Favorite logged!");
      window.dispatchEvent(new Event("entry-logged"));
    } catch {
      toast.error("Failed to log favorite");
    }
  };

  const handleDeleteFavorite = async (id: number) => {
    try {
      await api.deleteFavorite(id);
      setFavorites((prev) => prev.filter((f) => f.id !== id));
      toast.success("Favorite removed");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Button variant="ghost" size="sm" onClick={logout} className="text-destructive">
          <LogOut className="mr-1 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      {/* Profile form */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="calorie_goal">Calorie Goal</Label>
              <Input
                id="calorie_goal"
                type="number"
                value={form.calorie_goal}
                onChange={(e) =>
                  setForm({ ...form, calorie_goal: parseInt(e.target.value) || 2000 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Units</Label>
              <select
                id="unit"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.unit_preference}
                onChange={(e) => setForm({ ...form, unit_preference: e.target.value })}
              >
                <option value="metric">Metric (kg/cm)</option>
                <option value="imperial">Imperial (lb/in)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                placeholder="170"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weight_goal">Weight Goal (kg)</Label>
              <Input
                id="weight_goal"
                type="number"
                value={form.weight_goal}
                onChange={(e) => setForm({ ...form, weight_goal: e.target.value })}
                placeholder="70"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="25"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="activity">Activity Level</Label>
            <select
              id="activity"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.activity_level}
              onChange={(e) => setForm({ ...form, activity_level: e.target.value })}
            >
              <option value="">Select</option>
              <option value="sedentary">Sedentary</option>
              <option value="light">Lightly Active</option>
              <option value="moderate">Moderately Active</option>
              <option value="active">Very Active</option>
              <option value="extra">Extra Active</option>
            </select>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Macro Goals (C5) */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            Macro Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Protein (g)</Label>
              <Input
                type="number"
                value={macroGoals.protein}
                onChange={(e) =>
                  setMacroGoals({ ...macroGoals, protein: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Carbs (g)</Label>
              <Input
                type="number"
                value={macroGoals.carbs}
                onChange={(e) =>
                  setMacroGoals({ ...macroGoals, carbs: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fat (g)</Label>
              <Input
                type="number"
                value={macroGoals.fat}
                onChange={(e) =>
                  setMacroGoals({ ...macroGoals, fat: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSaveMacroGoals} className="w-full">
            Save Macro Goals
          </Button>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {([
              { value: "light" as const, icon: Sun, label: "Light" },
              { value: "dark" as const, icon: Moon, label: "Dark" },
              { value: "system" as const, icon: Monitor, label: "System" },
            ] as const).map(({ value, icon: Icon, label }) => (
              <Button
                key={value}
                variant={theme === value ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setTheme(value)}
              >
                <Icon className="mr-1.5 h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reminders & Export */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={toggleReminders}
          >
            {remindersEnabled ? (
              <BellOff className="mr-2 h-4 w-4" />
            ) : (
              <Bell className="mr-2 h-4 w-4" />
            )}
            {remindersEnabled ? "Disable Meal Reminders" : "Enable Meal Reminders"}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export Data as CSV
          </Button>
        </CardContent>
      </Card>

      {/* Favorites */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4 text-amber-500" />
            Favorites
          </CardTitle>
        </CardHeader>
        <CardContent>
          {favLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : favorites.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No favorites yet. Save meals you eat often!
            </p>
          ) : (
            <div className="space-y-2">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{fav.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {fav.total_calories} cal
                      {fav.use_count > 0 && (
                        <span> · used {fav.use_count}x</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-primary"
                      onClick={() => handleLogFavorite(fav.id)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => handleDeleteFavorite(fav.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function scheduleReminders() {
  // Schedule browser notifications for meal times
  const mealTimes = [
    { hour: 8, label: "breakfast" },
    { hour: 12, label: "lunch" },
    { hour: 19, label: "dinner" },
  ];

  const checkAndNotify = () => {
    if (localStorage.getItem("reminders_enabled") !== "true") return;

    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    for (const meal of mealTimes) {
      if (hour === meal.hour && minute === 0) {
        new Notification("NourishAI", {
          body: `Time to log your ${meal.label}!`,
          icon: "/favicon.svg",
          tag: `meal-reminder-${meal.label}`,
        });
      }
    }
  };

  // Check every minute
  setInterval(checkAndNotify, 60000);
}

// Start reminders if enabled
if (localStorage.getItem("reminders_enabled") === "true") {
  scheduleReminders();
}
