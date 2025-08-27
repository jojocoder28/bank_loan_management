
"use client";

import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { Menu, Landmark } from "lucide-react";
import { SidebarNav } from "./sidebar";
import { User } from "@/lib/types";
import Link from "next/link";


export function Header({ user }: { user: User }) {
  
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
        <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
               <SidebarNav user={user} isMobile={true} />
            </SheetContent>
          </Sheet>
        <div className="flex w-full items-center justify-center">
             <Link
                href={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"}
                className="flex items-center gap-2 font-semibold text-lg"
            >
                <Landmark className="h-6 w-6 text-primary" />
                <span className="sr-only">Co-op Bank</span>
            </Link>
        </div>
    </header>
  );
}
