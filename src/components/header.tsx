"use client";

import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { Button } from "./ui/button";
import { Menu, Landmark, X, Bell } from "lucide-react";
import { SidebarNav } from "./sidebar";
import { User } from "@/lib/types";
import Link from "next/link";
import { UserNav } from "./user-nav";
import React from "react";
import { getPendingApprovalCount } from "@/app/admin/approvals/actions";
import { Badge } from "./ui/badge";
import { ThemeToggle } from "./theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";


export function Header({ user }: { user: User }) {
  const [approvalCount, setApprovalCount] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  const fetchApprovalCount = React.useCallback(() => {
    if (user.role === 'admin') {
      getPendingApprovalCount().then(count => {
        setApprovalCount(count);
      });
    }
  }, [user.role]);

  React.useEffect(() => {
    fetchApprovalCount();
    const handleCountChanged = () => fetchApprovalCount();
    window.addEventListener('approvalCountChanged', handleCountChanged);
    const intervalId = setInterval(fetchApprovalCount, 30000);
    return () => {
      window.removeEventListener('approvalCountChanged', handleCountChanged);
      clearInterval(intervalId);
    }
  }, [fetchApprovalCount]);

  // Derive a clean page title from the path
  const pageTitle = React.useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (!last || last === 'dashboard') return 'Dashboard';
    return last
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }, [pathname]);

  return (
    <>
      {/* ── Mobile Top Header ─────────────────────────────────── */}
      <header className={cn(
        "md:hidden sticky top-0 z-40 w-full",
        "flex h-16 items-center gap-3 px-4",
        "bg-background/80 backdrop-blur-xl border-b border-border/50",
        "supports-[backdrop-filter]:bg-background/60"
      )}>
        {/* Hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 -ml-1 rounded-xl hover:bg-muted/80"
              id="mobile-menu-trigger"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>

          {/* ── Drawer ───────────────────────────────────────── */}
          <SheetContent
            side="left"
            className="p-0 w-[300px] border-r-0 bg-background/95 backdrop-blur-2xl shadow-2xl"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>Main navigation for the application.</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col h-full">
              {/* Drawer Header with gradient */}
              <div className="relative flex items-center justify-between px-5 py-5 overflow-hidden">
                {/* gradient blob */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent pointer-events-none" />
                <div className="absolute -top-8 -left-8 size-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                <Link
                  href={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"}
                  onClick={() => setOpen(false)}
                  className="relative flex items-center gap-2.5 z-10"
                >
                  <div className="flex items-center justify-center size-9 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                    <Landmark className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight">S&KGPPS Co-op</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Credit Society</p>
                  </div>
                </Link>
              </div>

              {/* User identity strip */}
              <div className="mx-4 mb-4 flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/40">
                <Avatar className="size-9 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                  <AvatarImage src={user.photoUrl ?? undefined} alt={user.name ?? "User"} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 capitalize">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto px-3 pb-4">
                <p className="px-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Navigation
                </p>
                <SidebarNav
                  user={user}
                  isMobile={true}
                  approvalCount={approvalCount}
                  onLinkClick={() => setOpen(false)}
                />
              </div>

              {/* Drawer footer actions */}
              <div className="border-t border-border/40 px-5 py-4 flex items-center justify-between gap-2">
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-xl hover:bg-muted/60"
                >
                  Settings
                </Link>
                <ThemeToggle />
                <form
                  action="/logout"
                  method="POST"
                  className="flex-1 flex"
                >
                  {/* We use the logout action via UserNav instead */}
                </form>
                <UserNav user={user} isMobile={true} />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Centered Page Title */}
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold tracking-tight truncate px-2">{pageTitle}</p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {approvalCount > 0 && user.role === 'admin' && (
            <Link href="/admin/approvals">
              <Button variant="ghost" size="icon" className="relative rounded-xl size-9 hover:bg-muted/80">
                <Bell className="size-4.5" />
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow">
                  {approvalCount > 9 ? '9+' : approvalCount}
                </span>
              </Button>
            </Link>
          )}
          <UserNav user={user} isMobile={true} />
        </div>
      </header>
    </>
  );
}
