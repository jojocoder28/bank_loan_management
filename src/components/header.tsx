
"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";
import { logout } from "@/app/logout/actions";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Menu, Landmark } from "lucide-react";
import { SidebarNav } from "./sidebar";


export function Header({ user, onMenuClick }: { user: User | null, onMenuClick: () => void }) {
  if (!user) {
    return null;
  }
  
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-40 sticky top-0">
      {/* Mobile Menu */}
      <div className="md:hidden">
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
              </SheetHeader>
              <SidebarNav user={user} isMobile={true} />
            </SheetContent>
          </Sheet>
      </div>
      
      {/* Desktop Menu Toggle */}
      <div className="hidden md:block">
         <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
      </div>

      <div className="flex w-full items-center justify-center">
         <Link
            href={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"}
            className="flex items-center gap-2 font-semibold text-lg"
        >
            <Landmark className="h-6 w-6 text-primary" />
            <span>Co-op Bank</span>
        </Link>
      </div>

      <div className="flex items-center gap-4 md:ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src={user.photoUrl ?? undefined} alt={user.name ?? 'User'} />
                <AvatarFallback>{user.name?.[0] ?? 'U'}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                 <p className="text-sm font-medium leading-none">Welcome, {user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={logout} className="w-full">
                <button type="submit" className="w-full text-left">
                  Log out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
