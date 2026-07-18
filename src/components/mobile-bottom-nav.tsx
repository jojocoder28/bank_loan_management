"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HandCoins,
  Wallet,
  FileCheck,
  Users,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

const memberTabs = [
  { href: "/dashboard",    label: "Home",     icon: LayoutDashboard },
  { href: "/apply-loan",   label: "Loan",     icon: HandCoins },
  { href: "/my-finances",  label: "Finance",  icon: Wallet },
  { href: "/contact-us",   label: "Contact",  icon: Mail },
];

const adminTabs = [
  { href: "/admin/dashboard",  label: "Home",      icon: LayoutDashboard },
  { href: "/admin/approvals",  label: "Approvals", icon: FileCheck },
  { href: "/admin/users",      label: "Members",   icon: Users },
];

export function MobileBottomNav({
  user,
  approvalCount = 0,
}: {
  user: User;
  approvalCount?: number;
}) {
  const pathname = usePathname();
  const tabs = user.role === "admin" ? adminTabs : memberTabs;

  return (
    /* Outer wrapper — adds safe-area padding below the pill */
    <div
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50",
        "flex items-end justify-center",
        "pb-[max(12px,env(safe-area-inset-bottom))]",
        "pointer-events-none"          /* let taps fall through the gap area */
      )}
    >
      {/* ── Floating pill bar ── */}
      <nav
        className="pill-nav pointer-events-auto flex items-center gap-1 rounded-[28px] px-2 py-2"
        style={{ minWidth: 260, maxWidth: "90vw" }}
      >
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          const showBadge = href === "/admin/approvals" && approvalCount > 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "tab-item relative flex flex-col items-center justify-center gap-1 flex-1",
                "rounded-[22px] py-2 px-3 min-w-[56px]",
                "transition-colors duration-200"
              )}
            >
              {/* Active pill glow background */}
              {isActive && (
                <span
                  className="absolute inset-0 rounded-[22px] pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, hsl(220,75%,27%,0.13) 0%, hsl(35,90%,55%,0.08) 100%)",
                  }}
                />
              )}

              {/* Icon */}
              <span className="relative flex items-center justify-center">
                <span
                  className={cn(
                    "flex items-center justify-center rounded-2xl transition-all duration-300",
                    isActive
                      ? "size-9 bg-gradient-to-br from-[hsl(220,75%,27%)] to-[hsl(199,80%,50%)] text-white shadow-lg shadow-[hsl(220,75%,27%,0.35)] scale-110"
                      : "size-8 text-muted-foreground"
                  )}
                >
                  <Icon
                    className={cn("transition-all duration-200", isActive ? "size-[18px]" : "size-5")}
                    strokeWidth={isActive ? 2.5 : 1.75}
                  />
                </span>

                {/* Notification badge */}
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 flex size-[18px] items-center justify-center rounded-full bg-[hsl(35,90%,55%)] text-[8px] font-bold text-[hsl(222,47%,8%)] shadow-sm ring-2 ring-background">
                    {approvalCount > 9 ? "9+" : approvalCount}
                  </span>
                )}
              </span>

              {/* Label */}
              <span
                className={cn(
                  "text-[9.5px] font-semibold leading-none tracking-wide transition-all duration-200",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
