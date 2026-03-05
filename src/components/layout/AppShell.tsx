import { Outlet, NavLink } from "react-router-dom";
import { CalendarDays, Clock, BarChart3, User } from "lucide-react";
import { EntryBar } from "@/components/EntryBar";

const tabs = [
  { to: "/today", icon: CalendarDays, label: "Today" },
  { to: "/history", icon: Clock, label: "History" },
  { to: "/insights", icon: BarChart3, label: "Insights" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function AppShell() {
  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      {/* Main content area — scrollable */}
      <main className="flex-1 overflow-y-auto pb-36">
        <Outlet />
      </main>

      {/* Persistent AI entry bar */}
      <EntryBar />

      {/* Bottom tab navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
        <div className="mx-auto flex max-w-lg items-center justify-around py-2">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
