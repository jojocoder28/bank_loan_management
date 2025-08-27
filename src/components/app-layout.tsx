
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import type { User } from "@/lib/types";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

export function AppLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  return (
    <div
      className={cn(
        "grid min-h-screen w-full",
        isSidebarCollapsed
          ? "md:grid-cols-[80px_1fr]"
          : "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]"
      )}
    >
      <Sidebar user={user} isCollapsed={isSidebarCollapsed} />
      <div className="flex flex-col">
        <Header user={user} onMenuClick={toggleSidebar} />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
}
