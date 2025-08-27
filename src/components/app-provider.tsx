
"use client";

import type { User } from "@/lib/types";
import { AppLayout } from "./app-layout";

export function AppProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  return (
    <AppLayout user={user}>
        {children}
    </AppLayout>
  );
}
