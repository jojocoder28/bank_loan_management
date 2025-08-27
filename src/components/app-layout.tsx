
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import type { User } from "@/lib/types";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

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

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar user={user} />
      <div className="flex flex-col">
        <Header user={user} />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
}
