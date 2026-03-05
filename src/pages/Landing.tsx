import { Link } from "react-router-dom";
import { Leaf, Sparkles, Camera, BarChart3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Landing() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <Leaf className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight">NourishAI</h1>
        <p className="mb-8 max-w-md text-lg text-muted-foreground">
          Track calories effortlessly. Just type what you ate — or snap a photo
          — and AI handles the rest.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/register">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full px-8">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>

      {/* Features grid */}
      <div className="mx-auto grid max-w-lg gap-4 px-6 pb-16 sm:grid-cols-2">
        {[
          {
            icon: Sparkles,
            title: "AI-Powered",
            desc: "Natural language input — just describe your meal",
          },
          {
            icon: Camera,
            title: "Photo Logging",
            desc: "Snap a photo and let AI identify the food",
          },
          {
            icon: BarChart3,
            title: "Macro Tracking",
            desc: "Calories, protein, carbs, and fat at a glance",
          },
          {
            icon: Zap,
            title: "Instant Logging",
            desc: "Log meals in seconds, not minutes",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <Icon className="mb-3 h-6 w-6 text-primary" />
            <h3 className="mb-1 font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
