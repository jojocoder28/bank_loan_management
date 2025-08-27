
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import type { User } from "@/lib/types";
import { Header } from "./header";

export function AppProvider({
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
    <div className="flex min-h-screen w-full flex-col">
      <Header user={user} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
