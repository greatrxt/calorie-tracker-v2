import { useState, useRef } from "react";
import { Send, Camera, Loader2, X, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api, type ParsedEntry } from "@/lib/api";
import { toast } from "sonner";

export function EntryBar() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedEntry[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!text.trim() && !photoPreview) return;

    setLoading(true);
    try {
      if (photoPreview) {
        // Photo goes direct — no preview step
        await api.parsePhoto(photoPreview);
        toast.success("Photo analyzed and logged!");
        setPhotoPreview(null);
        setText("");
        window.dispatchEvent(new Event("entry-logged"));
      } else {
        // Text entry: show preview first
        const res = await api.previewEntry(text.trim());
        setPreview(res.entries);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse entry");
    } finally {
      setLoading(false);
    }
  };

  const confirmEntry = async () => {
    setLoading(true);
    try {
      await api.parseText(text.trim());
      toast.success("Entry logged!");
      setText("");
      setPreview(null);
      window.dispatchEvent(new Event("entry-logged"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to log entry");
    } finally {
      setLoading(false);
    }
  };

  const cancelPreview = () => {
    setPreview(null);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (preview) {
        confirmEntry();
      } else {
        handleSubmit();
      }
    }
  };

  return (
    <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto max-w-lg">
        {/* Preview confirmation */}
        {preview && preview.length > 0 && (
          <Card className="mb-3 border-primary/30 bg-accent/50">
            <CardContent className="p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                AI parsed your entry:
              </p>
              <div className="space-y-1.5">
                {preview.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">
                      {entry.entry_type === "weight"
                        ? `Weight: ${entry.weight_kg}kg`
                        : entry.entry_type === "water"
                          ? `Water: ${entry.amount_ml}ml`
                          : `${entry.name} (${entry.quantity} ${entry.unit})`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.entry_type === "meal" &&
                        `${entry.calories} cal · P${Math.round(entry.protein)}g C${Math.round(entry.carbs)}g F${Math.round(entry.fat)}g`}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 rounded-full"
                  onClick={confirmEntry}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="mr-1 h-3.5 w-3.5" />
                  )}
                  Confirm
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={cancelPreview}
                  disabled={loading}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photo preview */}
        {photoPreview && (
          <div className="mb-2 flex items-center gap-2">
            <img
              src={photoPreview}
              alt="Preview"
              className="h-16 w-16 rounded-lg object-cover"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPhotoPreview(null)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Input row */}
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhoto}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 shrink-0 p-0 text-muted-foreground hover:text-primary"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
          >
            <Camera className="h-5 w-5" />
          </Button>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="2 eggs, toast with butter..."
            className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={loading}
          />
          <Button
            size="sm"
            className="h-10 w-10 shrink-0 rounded-full p-0"
            onClick={preview ? confirmEntry : handleSubmit}
            disabled={loading || (!text.trim() && !photoPreview)}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
          Log meals, weight, or water — e.g. "chicken salad 350cal" or "72kg" or "500ml water"
        </p>
      </div>
    </div>
  );
}
