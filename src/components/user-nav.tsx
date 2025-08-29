
"use client";

import Link from "next/link";
import { Settings, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { logout } from "@/app/logout/actions";
import { ThemeToggle } from "./theme-toggle";

export function UserNav({ user, isCollapsed = false }: { user: User; isCollapsed?: boolean }) {
  if (!user) return null;

  return (
    <div className={cn("px-2", isCollapsed ? "flex justify-center" : "")}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn("w-full justify-start text-left gap-3", isCollapsed && "justify-center size-12 p-0")}
          >
            <Avatar className="size-8">
              <AvatarImage src={user.photoUrl ?? undefined} alt={user.name ?? "User"} />
              <AvatarFallback>{user.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "flex flex-col items-start max-w-28 sm:hidden md:hidden lg:flex",
                isCollapsed && "hidden"
              )}
            >
              <p className="text-sm font-medium leading-none truncate">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={12} className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
              <UserIcon /> Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
              <Settings /> Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <ThemeToggle />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <form action={logout} className="w-full">
              <button type="submit" className="w-full text-left flex items-center gap-2 cursor-pointer">
                <LogOut /> Log out
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
