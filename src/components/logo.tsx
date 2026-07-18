"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  collapsed?: boolean;
  /** Force light text (white) — for dark backgrounds like the sidebar */
  invertText?: boolean;
}

/**
 * SKGPPST Logo — single SVG mark, fully transparent background.
 * The hexagonal icon (navy + gold) renders clearly on ANY background.
 * Text color adapts via Tailwind's dark: variant.
 */
export function Logo({
  className,
  showText = true,
  size = "md",
  collapsed = false,
  invertText = false,
}: LogoProps) {
  const sizeMap = {
    sm: { icon: 28, gap: "gap-2",   nameClass: "text-[13px]", subClass: "text-[9.5px]" },
    md: { icon: 36, gap: "gap-2.5", nameClass: "text-[15px]", subClass: "text-[10px]"  },
    lg: { icon: 46, gap: "gap-3",   nameClass: "text-[19px]", subClass: "text-[11px]"  },
  };
  const s = sizeMap[size];

  return (
    <div className={cn("flex items-center shrink-0", s.gap, className)}>
      {/* ══ SVG Mark — NO background, pure gold + navy ══ */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="SKGPPST logo mark"
        className="shrink-0 drop-shadow-sm"
        style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.18))" }}
      >
        {/* Hexagonal badge — gold */}
        <path
          d="M24 2.5 L41.5 12.5 L41.5 35.5 L24 45.5 L6.5 35.5 L6.5 12.5 Z"
          fill="#f5a623"
        />
        {/* Inner inset — navy */}
        <path
          d="M24 8 L37 15.5 L37 32.5 L24 40 L11 32.5 L11 15.5 Z"
          fill="#1a3a6b"
        />
        {/* "S" stroke — white */}
        <path
          d="M17.5 19.5 C17.5 17 19.5 15.5 21.5 16.5 C23.5 17.5 22.5 20.5 20 21 C17.5 21.5 16.5 24 18 25.5 C19.5 27 22 27 23 25"
          stroke="white"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* "K" vertical — white */}
        <line x1="25.5" y1="15.5" x2="25.5" y2="27.5"
          stroke="white" strokeWidth="2.1" strokeLinecap="round" />
        {/* "K" upper arm */}
        <line x1="25.5" y1="21.5" x2="31" y2="15.5"
          stroke="white" strokeWidth="2.1" strokeLinecap="round" />
        {/* "K" lower arm */}
        <line x1="25.5" y1="21.5" x2="31" y2="27.5"
          stroke="white" strokeWidth="2.1" strokeLinecap="round" />
        {/* Gold dot bottom */}
        <circle cx="24" cy="37.5" r="1.8" fill="#f5a623" opacity="0.9" />
      </svg>

      {/* ══ Text — shows on both light and dark surfaces ══ */}
      {showText && !collapsed && (
        <div className="flex flex-col leading-none select-none">
          <span
            className={cn(
              "font-extrabold tracking-tight leading-none",
              s.nameClass,
              invertText
                ? "text-white"
                : "text-gray-900 dark:text-white"
            )}
            style={{ fontFamily: "Sora, Inter, sans-serif" }}
          >
            SKGPPST
          </span>
          <span
            className={cn(
              "font-semibold tracking-widest uppercase mt-[3px]",
              s.subClass,
              invertText
                ? "text-white/55"
                : "text-gray-500 dark:text-gray-400"
            )}
          >
            Co-op Society
          </span>
        </div>
      )}
    </div>
  );
}
