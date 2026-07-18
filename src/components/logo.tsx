"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  collapsed?: boolean;
}

export function Logo({ className, showText = true, size = "md", collapsed = false }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const sizeMap = {
    sm: { img: 28, text: "text-sm" },
    md: { img: 36, text: "text-base" },
    lg: { img: 48, text: "text-xl" },
  };
  const s = sizeMap[size];

  const logoSrc = mounted && resolvedTheme === "dark" ? "/logo-dark.png" : "/logo-light.png";

  return (
    <div className={cn("flex items-center gap-2.5 shrink-0", className)}>
      <div
        className="relative shrink-0"
        style={{ width: s.img, height: s.img }}
      >
        {mounted ? (
          <Image
            src={logoSrc}
            alt="SKGPPST Logo"
            width={s.img}
            height={s.img}
            className="object-contain"
            priority
          />
        ) : (
          /* SSR/hydration placeholder — matches dark logo position */
          <div
            className="rounded-full bg-gradient-to-br from-[#1a3a6b] to-[#4fc3f7]"
            style={{ width: s.img, height: s.img }}
          />
        )}
      </div>

      {showText && !collapsed && (
        <div className="flex flex-col leading-none">
          <span className={cn("font-bold tracking-tight text-sidebar-foreground", s.text)} style={{ fontFamily: 'Sora, sans-serif' }}>
            SKGPPST
          </span>
          <span className="text-[10px] text-sidebar-muted-foreground font-medium tracking-wider uppercase opacity-70">
            Co-op Society
          </span>
        </div>
      )}
    </div>
  );
}
