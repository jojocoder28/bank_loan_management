"use client";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { AlignLeft, Bell, X } from "lucide-react";
import { SidebarNav } from "./sidebar";
import { User } from "@/lib/types";
import Link from "next/link";
import { UserNav } from "./user-nav";
import React from "react";
import { getPendingApprovalCount } from "@/app/admin/approvals/actions";
import { ThemeToggle } from "./theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";

export function Header({ user }: { user: User }) {
  const [approvalCount, setApprovalCount] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  const fetchApprovalCount = React.useCallback(() => {
    if (user.role === "admin") {
      getPendingApprovalCount().then(setApprovalCount);
    }
  }, [user.role]);

  React.useEffect(() => {
    fetchApprovalCount();
    const handler = () => fetchApprovalCount();
    window.addEventListener("approvalCountChanged", handler);
    const id = setInterval(fetchApprovalCount, 30000);
    return () => {
      window.removeEventListener("approvalCountChanged", handler);
      clearInterval(id);
    };
  }, [fetchApprovalCount]);

  /* Derive page title from path */
  const pageTitle = React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (!last || last === "dashboard") return "Dashboard";
    return last
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }, [pathname]);

  return (
    <>
      {/* ══════════════════════════════════════════
          MOBILE TOP HEADER — frosted glass bar
      ══════════════════════════════════════════ */}
      <header
        className={cn(
          "md:hidden sticky top-0 z-40 w-full",
          "flex h-[58px] items-center justify-between px-4 gap-2",
          "glass border-b border-white/30 dark:border-white/[0.07]",
          "shadow-sm shadow-black/5"
        )}
      >
        {/* Left — hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex items-center justify-center size-9 rounded-xl transition-all duration-150 active:scale-90",
                "bg-white/60 dark:bg-white/[0.07] border border-white/60 dark:border-white/10",
                "text-foreground hover:bg-white/80 dark:hover:bg-white/[0.1] shadow-sm"
              )}
              id="mobile-menu-trigger"
              aria-label="Open menu"
            >
              <AlignLeft className="size-[18px]" />
            </button>
          </SheetTrigger>

          {/* ── SIDE DRAWER ── */}
          <SheetContent
            side="left"
            className="p-0 w-[300px] border-r-0 bg-background/95 dark:bg-[hsl(225,50%,4%,0.97)] backdrop-blur-2xl shadow-2xl"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>Main navigation links.</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col h-full">
              {/* Drawer header — gradient art */}
              <div className="relative flex items-center justify-between px-5 py-5 overflow-hidden shrink-0">
                {/* Background blobs */}
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary)_/_0.18)] via-[hsl(var(--gold)_/_0.08)] to-transparent pointer-events-none" />
                <div className="absolute -top-10 -left-10 size-48 bg-[hsl(var(--primary)_/_0.15)] rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
                <div className="absolute -bottom-10 -right-4 size-32 bg-[hsl(var(--gold)_/_0.1)] rounded-full blur-3xl pointer-events-none" />

                <Link
                  href={user.role === "admin" ? "/admin/dashboard" : "/dashboard"}
                  onClick={() => setOpen(false)}
                  className="relative z-10"
                >
                  <Logo showText={true} size="md" />
                </Link>

                <button
                  onClick={() => setOpen(false)}
                  className="relative z-10 flex items-center justify-center size-8 rounded-xl bg-muted/60 hover:bg-muted transition-colors"
                  aria-label="Close menu"
                >
                  <X className="size-4 text-muted-foreground" />
                </button>
              </div>

              {/* User identity strip */}
              <div className="mx-4 mb-4 flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/50 backdrop-blur-sm shrink-0">
                <Avatar className="size-10 ring-2 ring-[hsl(var(--gold)_/_0.4)] ring-offset-2 ring-offset-background shadow-md">
                  <AvatarImage src={user.photoUrl ?? undefined} alt={user.name ?? "User"} />
                  <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--gold))] text-white font-bold text-sm">
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                  <p className="text-sm font-bold tracking-tight truncate" style={{ fontFamily: "Sora, sans-serif" }}>
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[hsl(var(--gold)_/_0.15)] text-[hsl(var(--gold))] border border-[hsl(var(--gold)_/_0.3)] capitalize shrink-0">
                  {user.role === "board_member" ? "Board" : user.role}
                </span>
              </div>

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto pb-4">
                <p className="px-7 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  Navigation
                </p>
                <SidebarNav
                  user={user}
                  isMobile={true}
                  approvalCount={approvalCount}
                  onLinkClick={() => setOpen(false)}
                />
              </div>

              {/* Drawer footer */}
              <div className="border-t border-border/40 px-4 py-4 flex items-center gap-2 shrink-0">
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2.5 px-3 rounded-xl hover:bg-muted/60 border border-border/50"
                >
                  Settings
                </Link>
                <ThemeToggle />
                <UserNav user={user} isMobile={true} />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Center — page title */}
        <div className="flex-1 text-center">
          <p
            className="text-[14px] font-bold tracking-tight truncate px-2"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            {pageTitle}
          </p>
        </div>

        {/* Right — notification + avatar */}
        <div className="flex items-center gap-1.5 shrink-0">
          {approvalCount > 0 && user.role === "admin" && (
            <Link href="/admin/approvals">
              <button
                className={cn(
                  "relative flex items-center justify-center size-9 rounded-xl transition-all active:scale-90",
                  "bg-white/60 dark:bg-white/[0.07] border border-white/60 dark:border-white/10 shadow-sm",
                  "text-foreground hover:bg-white/80 dark:hover:bg-white/[0.1]"
                )}
                aria-label="Pending approvals"
              >
                <Bell className="size-[17px]" />
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[hsl(var(--gold))] text-[8px] font-bold text-[hsl(var(--gold-foreground))] shadow">
                  {approvalCount > 9 ? "9+" : approvalCount}
                </span>
                {/* Pulse ring */}
                <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-[hsl(var(--gold)_/_0.5)] animate-ping-slow" />
              </button>
            </Link>
          )}

          <UserNav user={user} isMobile={true} />
        </div>
      </header>
    </>
  );
}
