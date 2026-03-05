import { useState } from "react";
import { api, type Weight } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface EditWeightDialogProps {
  weight: Weight;
  onClose: () => void;
  onSaved: () => void;
}

export function EditWeightDialog({ weight, onClose, onSaved }: EditWeightDialogProps) {
  const [weightKg, setWeightKg] = useState(weight.weight_kg.toString());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const val = parseFloat(weightKg);
    if (!val || val <= 0) {
      toast.error("Enter a valid weight");
      return;
    }
    setSaving(true);
    try {
      await api.updateWeight(weight.id, {
        weight_kg: val,
        timestamp: weight.timestamp,
      } as Partial<Weight>);
      toast.success("Weight updated");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-card p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Weight</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Weight (kg)</Label>
            <Input
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              autoFocus
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
