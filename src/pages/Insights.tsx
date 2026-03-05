import { useState, useEffect } from "react";
import { api, type DashboardStats } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { TrendingUp, Target, Calendar, Scale } from "lucide-react";

export function Insights() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats().then((res) => {
      setStats(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 pt-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6">
        <h1 className="mb-4 text-2xl font-bold">Insights</h1>
        <p className="text-muted-foreground">No data available yet.</p>
      </div>
    );
  }

  const chartData = stats.daily_calories.map((d) => ({
    day: new Date(d.day + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    calories: Math.round(d.total),
  }));

  const avg =
    chartData.length > 0
      ? Math.round(
          chartData.reduce((s, d) => s + d.calories, 0) / chartData.length
        )
      : 0;

  const daysOnTarget = chartData.filter(
    (d) => d.calories <= stats.calorie_goal && d.calories > 0
  ).length;

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-4 text-2xl font-bold">Insights</h1>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center p-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="mt-1 text-lg font-bold">{avg}</span>
            <span className="text-[10px] text-muted-foreground">Avg cal/day</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-3">
            <Target className="h-4 w-4 text-green-500" />
            <span className="mt-1 text-lg font-bold">{daysOnTarget}</span>
            <span className="text-[10px] text-muted-foreground">Days on goal</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-3">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="mt-1 text-lg font-bold">{chartData.length}</span>
            <span className="text-[10px] text-muted-foreground">Days tracked</span>
          </CardContent>
        </Card>
      </div>

      {/* Calorie chart */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Daily Calories (Last 30 Days)</h3>
          {chartData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Start logging meals to see your trends
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <ReferenceLine
                  y={stats.calorie_goal}
                  stroke="var(--destructive)"
                  strokeDasharray="4 4"
                  label={{
                    value: "Goal",
                    position: "right",
                    fill: "var(--destructive)",
                    fontSize: 10,
                  }}
                />
                <Bar
                  dataKey="calories"
                  fill="var(--primary)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Weight trend chart */}
      {stats.weight_history && stats.weight_history.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Scale className="h-4 w-4 text-purple-500" />
              Weight Trend
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart
                data={stats.weight_history.map((d) => ({
                  day: new Date(d.day + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  }),
                  weight: d.weight_kg,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                  domain={["dataMin - 1", "dataMax + 1"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [`${value} kg`, "Weight"]}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#a855f7" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Macro breakdown today */}
      <Card>
        <CardContent className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Today's Macro Split</h3>
          <div className="space-y-3">
            <MacroBar label="Protein" grams={stats.today_protein} color="bg-blue-500" />
            <MacroBar label="Carbs" grams={stats.today_carbs} color="bg-amber-500" />
            <MacroBar label="Fat" grams={stats.today_fat} color="bg-rose-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MacroBar({
  label,
  grams,
  color,
}: {
  label: string;
  grams: number;
  color: string;
}) {
  const calories =
    label === "Fat" ? grams * 9 : grams * 4;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {Math.round(grams)}g ({Math.round(calories)} cal)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.min(100, (grams / 150) * 100)}%` }}
        />
      </div>
    </div>
  );
}
