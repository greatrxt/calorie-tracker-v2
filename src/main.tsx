import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/useAuth";
import App from "./App";
import "./index.css";

// Apply saved theme before render to avoid flash
const savedTheme = localStorage.getItem("theme") || "system";
const isDark =
  savedTheme === "dark" ||
  (savedTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
if (isDark) document.documentElement.classList.add("dark");

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--card)",
              color: "var(--card-foreground)",
              border: "1px solid var(--border)",
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
