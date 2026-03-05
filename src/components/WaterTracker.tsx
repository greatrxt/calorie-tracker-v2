import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, Plus } from "lucide-react";
import { toast } from "sonner";

const QUICK_AMOUNTS = [250, 500];
const WATER_GOAL = 2500; // 2.5L default

interface WaterTrackerProps {
  currentMl: number;
  onUpdate: () => void;
}

export function WaterTracker({ currentMl, onUpdate }: WaterTrackerProps) {
  const [adding, setAdding] = useState(false);
  const progress = Math.min(currentMl / WATER_GOAL, 1);

  const addWater = async (ml: number) => {
    setAdding(true);
    try {
      await api.addWater(ml);
      toast.success(`Added ${ml}ml of water`);
      onUpdate();
    } catch {
      toast.error("Failed to add water");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-semibold">Water</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {Math.round(currentMl)}ml / {WATER_GOAL}ml
          </span>
        </div>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex gap-2">
          {QUICK_AMOUNTS.map((ml) => (
            <Button
              key={ml}
              variant="outline"
              size="sm"
              className="flex-1 rounded-full text-xs"
              onClick={() => addWater(ml)}
              disabled={adding}
            >
              <Plus className="mr-1 h-3 w-3" />
              {ml}ml
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
