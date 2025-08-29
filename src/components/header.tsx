
"use client";

import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { Button } from "./ui/button";
import { Menu, Landmark } from "lucide-react";
import { SidebarNav } from "./sidebar";
import { User } from "@/lib/types";
import Link from "next/link";
import { UserNav } from "./user-nav";


export function Header({ user }: { user: User }) {
  
  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sticky top-0 z-40 md:hidden">
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
               <SheetHeader>
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <SheetDescription className="sr-only">Main menu for navigating the application.</SheetDescription>
                </SheetHeader>
               <SidebarNav user={user} isMobile={true} />
            </SheetContent>
          </Sheet>
        <div className="flex items-center">
             <Link
                href={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"}
                className="flex items-center gap-2 font-semibold text-lg"
            >
                <Landmark className="h-6 w-6 text-primary" />
                <span className="">S&KGPPS Co-op</span>
            </Link>
        </div>
        <UserNav user={user} />
    </header>
  );
}
