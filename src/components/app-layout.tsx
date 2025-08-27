
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
  
  if (isAuthPage) {
    return <main>{children}</main>;
  }
  
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar user={user} />
      <div className="flex flex-col flex-1 md:ml-64">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto bg-muted/40">
            <div className="p-4 md:gap-8 md:p-8">
             {children}
            </div>
        </main>
      </div>
    </div>
  );
}
