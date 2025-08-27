
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
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  if (!user) {
    // This can happen briefly on page refresh before redirect.
    // Or if the session is lost. A redirect will handle it.
    return null; 
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar 
        user={user} 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <div 
        className={cn(
          "flex flex-col flex-1 transition-all duration-300",
          isCollapsed ? "md:ml-20" : "md:ml-64"
        )}
      >
        <Header user={user} />
        <main className="flex-1 bg-muted/40 p-4 md:p-8">
            {children}
        </main>
      </div>
    </div>
  );
}
