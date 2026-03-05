import { useState, useEffect, useCallback } from "react";
import { api, type DashboardStats, type Meal } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalorieRing } from "@/components/CalorieRing";
import { MealCard } from "@/components/MealCard";
import { WaterTracker } from "@/components/WaterTracker";
import { Flame, Droplets, Scale, Zap } from "lucide-react";

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, mealsRes] = await Promise.all([
        api.getStats(),
        api.getTodayMeals(),
      ]);
      setStats(statsRes.data);
      setMeals(mealsRes.meals);
    } catch {
      // silently fail, data will show empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const handler = () => fetchData();
    window.addEventListener("entry-logged", handler);
    return () => window.removeEventListener("entry-logged", handler);
  }, [fetchData]);

  if (loading) return <DashboardSkeleton />;

  const goal = stats?.calorie_goal || user?.calorie_goal || 2000;
  const consumed = stats?.today_calories || 0;
  const remaining = Math.max(0, goal - consumed);

  // Load macro goals from localStorage
  const macroGoals = (() => {
    try {
      const saved = localStorage.getItem("macro_goals");
      return saved ? JSON.parse(saved) : { protein: 150, carbs: 250, fat: 65 };
    } catch {
      return { protein: 150, carbs: 250, fat: 65 };
    }
  })();

  // Group meals by meal_type
  const grouped: Record<string, Meal[]> = {};
  for (const meal of meals) {
    const type = meal.meal_type || "snack";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(meal);
  }
  const mealTypeOrder = ["breakfast", "lunch", "dinner", "snack"];

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Hey, {user?.username || "there"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Calorie ring + macro summary */}
      <Card className="mb-4">
        <CardContent className="flex items-center gap-6 p-5">
          <CalorieRing consumed={consumed} goal={goal} />
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-2xl font-bold">{remaining}</p>
              <p className="text-xs text-muted-foreground">calories remaining</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MacroChip
                label="Protein"
                value={stats?.today_protein || 0}
                goal={macroGoals.protein}
                color="bg-blue-500"
              />
              <MacroChip
                label="Carbs"
                value={stats?.today_carbs || 0}
                goal={macroGoals.carbs}
                color="bg-amber-500"
              />
              <MacroChip
                label="Fat"
                value={stats?.today_fat || 0}
                goal={macroGoals.fat}
                color="bg-rose-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats row */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <QuickStat
          icon={<Flame className="h-4 w-4 text-orange-500" />}
          label="Streak"
          value={`${stats?.streak || 0}d`}
        />
        <QuickStat
          icon={<Droplets className="h-4 w-4 text-blue-500" />}
          label="Water"
          value={`${Math.round((stats?.today_water_ml || 0) / 1000 * 10) / 10}L`}
        />
        <QuickStat
          icon={<Scale className="h-4 w-4 text-purple-500" />}
          label="Weight"
          value={
            stats?.latest_weight
              ? `${stats.latest_weight.weight_kg}kg`
              : "—"
          }
        />
      </div>

      {/* Water quick add */}
      <WaterTracker currentMl={stats?.today_water_ml || 0} onUpdate={fetchData} />

      {/* Today's meals */}
      <div className="mb-6 mt-6">
        <h2 className="mb-3 text-lg font-semibold">Today's Meals</h2>
        {meals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-8 text-center">
              <Zap className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No meals logged yet today.
              </p>
              <p className="text-xs text-muted-foreground">
                Use the bar below to log your first meal!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {mealTypeOrder.map((type) => {
              const typeMeals = grouped[type];
              if (!typeMeals || typeMeals.length === 0) return null;
              return (
                <div key={type}>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {typeMeals.reduce((s, m) => s + m.calories, 0)} cal
                    </span>
                  </div>
                  <div className="space-y-2">
                    {typeMeals.map((meal) => (
                      <MealCard key={meal.id} meal={meal} onDelete={fetchData} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MacroChip({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1">
        <div className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-sm font-semibold">{Math.round(value)}g</span>
      </div>
      <div className="mx-auto mt-1 h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center p-3">
        {icon}
        <span className="mt-1 text-lg font-bold">{value}</span>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 pt-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-36 w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}
