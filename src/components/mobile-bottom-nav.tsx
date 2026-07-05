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
import { Badge } from "@/components/ui/badge";

const memberTabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/apply-loan", label: "Apply Loan", icon: HandCoins },
  { href: "/my-finances", label: "Finances", icon: Wallet },
  { href: "/contact-us", label: "Contact", icon: Mail },
];

const adminTabs = [
  { href: "/admin/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/admin/approvals", label: "Approvals", icon: FileCheck },
  { href: "/admin/users", label: "Members", icon: Users },
];

export function MobileBottomNav({ user, approvalCount = 0 }: { user: User; approvalCount?: number }) {
  const pathname = usePathname();
  const tabs = user.role === "admin" ? adminTabs : memberTabs;

  return (
    <nav className={cn(
      "md:hidden fixed bottom-0 left-0 right-0 z-50",
      "h-[calc(64px+env(safe-area-inset-bottom))]",
      "bg-background/90 backdrop-blur-2xl border-t border-border/50",
      "supports-[backdrop-filter]:bg-background/75",
      "pb-[env(safe-area-inset-bottom)]"
    )}>
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          const showBadge = href === "/admin/approvals" && approvalCount > 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5",
                "flex-1 h-full px-1 py-2 transition-all duration-200",
                "group rounded-2xl"
              )}
            >
              {/* Active background pill */}
              {isActive && (
                <span className="absolute inset-x-2 inset-y-1.5 rounded-2xl bg-primary/10 dark:bg-primary/15" />
              )}

              {/* Icon container */}
              <span className="relative flex items-center justify-center">
                <span className={cn(
                  "flex items-center justify-center size-6 transition-all duration-200",
                  isActive ? "text-primary scale-110" : "text-muted-foreground group-active:scale-90"
                )}>
                  <Icon className="size-[22px]" strokeWidth={isActive ? 2.25 : 1.75} />
                </span>
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-sm">
                    {approvalCount > 9 ? "9+" : approvalCount}
                  </span>
                )}
              </span>

              {/* Label */}
              <span className={cn(
                "relative text-[10px] font-medium leading-none tracking-tight transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
