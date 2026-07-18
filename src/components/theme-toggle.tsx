"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className={cn(
        "relative flex items-center justify-center size-9 rounded-xl transition-all duration-200 active:scale-90",
        "bg-muted/60 hover:bg-muted border border-border/40 hover:border-border",
        "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {/* Sun */}
      <Sun
        className={cn(
          "size-[17px] transition-all duration-300 absolute",
          isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
        )}
      />
      {/* Moon */}
      <Moon
        className={cn(
          "size-[17px] transition-all duration-300 absolute",
          isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
        )}
      />
    </button>
  );
}
