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
  const isPublicPage = pathname.startsWith('/public') || pathname === '/';
  const isForcePasswordChangePage = pathname === '/force-password-change';

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const [approvalCount, setApprovalCount] = React.useState(0);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (user?.role === 'admin') {
      getPendingApprovalCount().then(setApprovalCount);
      const handleCountChanged = () => getPendingApprovalCount().then(setApprovalCount);
      window.addEventListener('approvalCountChanged', handleCountChanged);
      const interval = setInterval(() => getPendingApprovalCount().then(setApprovalCount), 30000);
      return () => {
        window.removeEventListener('approvalCountChanged', handleCountChanged);
        clearInterval(interval);
      };
    }
  }, [user?.role]);

  if (isAuthPage || isPublicPage || isForcePasswordChangePage) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }
  
  if (!isClient) {
    return null;
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar 
        user={user} 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main content area */}
      <div 
        className={cn(
          "flex flex-col flex-1 h-screen w-full transition-all duration-300 overflow-hidden",
          isCollapsed ? "md:ml-20" : "md:ml-64"
        )}
      >
        {/* Mobile-only glassmorphic top header */}
        <Header user={user} />

        {/* Page content — extra bottom padding on mobile for the bottom nav bar */}
        <main className={cn(
          "flex-1 bg-muted/40 p-4 md:p-8 overflow-y-auto min-w-0",
          "pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-8"
        )}>
          {children}
        </main>

        {/* Mobile bottom navigation bar */}
        <MobileBottomNav user={user} approvalCount={approvalCount} />
      </div>
    </div>
  );
}
