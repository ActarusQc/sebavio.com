"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { CLIENT_THEME_KEY } from "@/components/layout/client-theme";

function subscribe() {
  return () => undefined;
}

/**
 * Bascule crépuscule (défaut) / clair — espace client.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Changer le thème"
        disabled
        className="text-white/70"
      >
        <Sun className="size-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="min-h-11 min-w-11 text-white/80 hover:bg-white/10 hover:text-white sm:min-h-0 sm:min-w-0"
      aria-label={
        isDark ? "Passer en thème clair" : "Passer en thème crépuscule"
      }
      onClick={() => {
        const next = isDark ? "light" : "dark";
        setTheme(next);
        try {
          window.localStorage.setItem(CLIENT_THEME_KEY, next);
        } catch {
          /* ignore */
        }
      }}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
