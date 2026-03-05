import { useState, useEffect } from "react";
import { api, type Meal, type Weight } from "@/lib/api";
import { MealCard } from "@/components/MealCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Scale, ChevronDown, Clock, Trash2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { EditWeightDialog } from "@/components/EditWeightDialog";

export function History() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weights, setWeights] = useState<Weight[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"meals" | "weight">("meals");

  const fetchHistory = async (p: number) => {
    setLoading(true);
    try {
      const res = await api.getHistory(p);
      if (p === 1) {
        setMeals(res.data.meals);
        setWeights(res.data.weights);
      } else {
        setMeals((prev) => [...prev, ...res.data.meals]);
        setWeights((prev) => [...prev, ...res.data.weights]);
      }
      setHasNext(res.data.has_next);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, []);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchHistory(next);
  };

  const refresh = () => {
    setPage(1);
    fetchHistory(1);
  };

  // Group meals by date
  const mealsByDate: Record<string, Meal[]> = {};
  for (const meal of meals) {
    const day = meal.timestamp.slice(0, 10);
    if (!mealsByDate[day]) mealsByDate[day] = [];
    mealsByDate[day].push(meal);
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-4 text-2xl font-bold">History</h1>

      {/* Tab toggle */}
      <div className="mb-4 flex gap-2">
        <Button
          variant={tab === "meals" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setTab("meals")}
        >
          Meals
        </Button>
        <Button
          variant={tab === "weight" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setTab("weight")}
        >
          Weight
        </Button>
      </div>

      {loading && page === 1 ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : tab === "meals" ? (
        <div className="space-y-4">
          {Object.keys(mealsByDate).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-8">
                <Clock className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No meal history yet</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(mealsByDate).map(([date, dayMeals]) => (
              <div key={date}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-semibold">{formatDate(date)}</span>
                  <Badge variant="secondary" className="text-xs">
                    {dayMeals.reduce((s, m) => s + m.calories, 0)} cal
                  </Badge>
                </div>
                <div className="space-y-2">
                  {dayMeals.map((meal) => (
                    <MealCard key={meal.id} meal={meal} onDelete={refresh} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {weights.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-8">
                <Scale className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No weight entries yet</p>
              </CardContent>
            </Card>
          ) : (
            weights.map((w) => (
              <WeightCard key={w.id} weight={w} onDelete={refresh} />
            ))
          )}
        </div>
      )}

      {hasNext && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loading}
            className="rounded-full"
          >
            <ChevronDown className="mr-1 h-4 w-4" />
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

function WeightCard({ weight, onDelete }: { weight: Weight; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteWeight(weight.id);
      toast.success(`Deleted weight entry (${weight.weight_kg}kg)`);
      onDelete();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="group">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Scale className="h-5 w-5 text-purple-500" />
            <div>
              <p className="font-semibold">{weight.weight_kg} kg</p>
              <p className="text-xs text-muted-foreground">
                {new Date(weight.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      {editing && (
        <EditWeightDialog
          weight={weight}
          onClose={() => setEditing(false)}
          onSaved={onDelete}
        />
      )}
    </>
  );
}
