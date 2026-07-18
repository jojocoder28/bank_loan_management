"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import type { User } from "@/lib/types";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { cn } from "@/lib/utils";
import { getPendingApprovalCount } from "@/app/admin/approvals/actions";

export function AppLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isPublicPage = pathname.startsWith("/public") || pathname === "/";
  const isForcePasswordChangePage = pathname === "/force-password-change";
  const isResetPasswordPage = pathname.startsWith("/reset-password");

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const [approvalCount, setApprovalCount] = React.useState(0);

  React.useEffect(() => { setIsClient(true); }, []);

  React.useEffect(() => {
    if (user?.role === "admin") {
      getPendingApprovalCount().then(setApprovalCount);
      const handler = () => getPendingApprovalCount().then(setApprovalCount);
      window.addEventListener("approvalCountChanged", handler);
      const interval = setInterval(() => getPendingApprovalCount().then(setApprovalCount), 30000);
      return () => {
        window.removeEventListener("approvalCountChanged", handler);
        clearInterval(interval);
      };
    }
  }, [user?.role]);

  if (isAuthPage || isPublicPage || isForcePasswordChangePage || isResetPasswordPage) {
    return <>{children}</>;
  }

  if (!user) return null;
  if (!isClient) return null;

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      {/* ── Animated background orbs (desktop only) ── */}
      <div className="hidden md:block pointer-events-none" aria-hidden>
        <div
          className="orb size-[500px] bg-[hsl(var(--primary))] animate-pulse-glow"
          style={{ position: "fixed", top: "-120px", right: "-100px", zIndex: 0 }}
        />
        <div
          className="orb size-[350px] bg-[hsl(var(--gold))]"
          style={{ position: "fixed", bottom: "-80px", right: "25%", zIndex: 0, animationDelay: "1.5s" }}
        />
      </div>

      {/* ── Desktop Sidebar ── */}
      <Sidebar
        user={user}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* ── Main content area ── */}
      <div
        className={cn(
          "relative flex flex-col flex-1 h-screen w-full overflow-hidden",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "md:ml-[72px]" : "md:ml-64"
        )}
      >
        {/* Mobile-only frosted glass top header */}
        <Header user={user} />

        {/* Page content */}
        <main
          className={cn(
            "relative flex-1 overflow-y-auto min-w-0",
            "p-4 md:p-6 lg:p-8",
            /* Extra bottom padding on mobile for the floating pill nav */
            "pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-6 lg:pb-8"
          )}
        >
          {children}
        </main>

        {/* Mobile floating pill navigation */}
        <MobileBottomNav user={user} approvalCount={approvalCount} />
      </div>
    </div>
  );
}
