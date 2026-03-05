import { useState } from "react";
import { api, type Meal } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Pencil } from "lucide-react";
import { EditMealDialog } from "@/components/EditMealDialog";
import { toast } from "sonner";

interface MealCardProps {
  meal: Meal;
  onDelete?: () => void;
}

export function MealCard({ meal, onDelete }: MealCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteMeal(meal.id);
      toast.success(`Deleted "${meal.name}"`, {
        description: "This action cannot be undone.",
        duration: 4000,
      });
      onDelete?.();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="group">
        <CardContent className="flex items-center gap-3 p-3">
          {meal.photo_url && (
            <img
              src={meal.photo_url}
              alt={meal.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{meal.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{meal.calories} cal</span>
              <span>·</span>
              <span>P {Math.round(meal.protein)}g</span>
              <span>C {Math.round(meal.carbs)}g</span>
              <span>F {Math.round(meal.fat)}g</span>
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
        <EditMealDialog
          meal={meal}
          onClose={() => setEditing(false)}
          onSaved={() => onDelete?.()}
        />
      )}
    </>
  );
}
