"use client";

import Link from "next/link";
import { Settings, LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { logout } from "@/app/logout/actions";
import { ThemeToggle } from "./theme-toggle";

export function UserNav({
  user,
  isCollapsed = false,
  isMobile = false,
}: {
  user: User;
  isCollapsed?: boolean;
  isMobile?: boolean;
}) {
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isMobile ? (
          /* Mobile header trigger — avatar circle */
          <button
            className={cn(
              "relative flex items-center justify-center size-9 rounded-xl",
              "bg-white/60 dark:bg-white/[0.07] border border-white/60 dark:border-white/10 shadow-sm",
              "transition-all active:scale-90 hover:bg-white/80 dark:hover:bg-white/[0.12]"
            )}
            aria-label="Account menu"
          >
            <Avatar className="size-7">
              <AvatarImage src={user.photoUrl ?? undefined} alt={user.name ?? "User"} />
              <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--gold))] text-white text-xs font-bold">
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          </button>
        ) : isCollapsed ? (
          /* Collapsed sidebar trigger — avatar only */
          <button
            className="flex items-center justify-center rounded-xl transition-all active:scale-90"
            aria-label="Account menu"
          >
            <Avatar className="size-9 ring-2 ring-[hsl(var(--gold)_/_0.4)] ring-offset-2 ring-offset-[hsl(222,47%,9%)]">
              <AvatarImage src={user.photoUrl ?? undefined} alt={user.name ?? "User"} />
              <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--gold))] text-white text-sm font-bold">
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          </button>
        ) : (
          /* Full sidebar trigger — avatar + name + chevron */
          <button
            className={cn(
              "group w-full flex items-center gap-3 rounded-xl px-3 py-2.5",
              "bg-sidebar-muted/40 hover:bg-sidebar-muted/70 border border-sidebar-border/60",
              "transition-all duration-200 active:scale-[0.98]"
            )}
          >
            <Avatar className="size-8 ring-2 ring-[hsl(var(--gold)_/_0.35)] ring-offset-1 ring-offset-[hsl(222,47%,9%)] shrink-0">
              <AvatarImage src={user.photoUrl ?? undefined} alt={user.name ?? "User"} />
              <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--gold))] text-white text-xs font-bold">
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start min-w-0 flex-1">
              <p
                className="text-[13px] font-semibold leading-tight truncate text-sidebar-foreground"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                {user.name}
              </p>
              <p className="text-[10px] leading-tight text-sidebar-muted-foreground truncate capitalize">
                {user.role === "board_member" ? "Board Member" : user.role}
              </p>
            </div>
            <ChevronDown className="size-3.5 text-sidebar-muted-foreground group-hover:text-sidebar-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0" />
          </button>
        )}
      </DropdownMenuTrigger>

      {/* ── Dropdown ── */}
      <DropdownMenuContent
        align={isMobile ? "end" : "start"}
        sideOffset={12}
        className="w-56 border border-border/60 shadow-xl"
      >
        <DropdownMenuLabel className="flex flex-col gap-0.5 pb-2">
          <span className="font-semibold text-sm" style={{ fontFamily: "Sora, sans-serif" }}>
            {user.name}
          </span>
          <span className="text-xs text-muted-foreground font-normal truncate">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2.5 cursor-pointer">
            <UserIcon className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2.5 cursor-pointer">
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0">
          <div className="w-full px-2 py-1.5">
            <ThemeToggle />
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
          <form action={logout} className="w-full">
            <button
              type="submit"
              className="w-full text-left flex items-center gap-2.5 cursor-pointer"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
