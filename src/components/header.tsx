
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
import { Logo } from "./logo";
import type { User } from "@/lib/types";
import { logout } from "@/app/logout/actions";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/apply-loan", label: "Apply for Loan" },
  { href: "/contact-us", label: "Contact Us" },
];

export function Header({ user }: { user: User | null }) {
  if (!user) {
    return null;
  }

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Logo />
        {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
            </Link>
        ))}
      </nav>
      
       <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
            <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
                <SheetDescription>A list of links to navigate the site.</SheetDescription>
            </SheetHeader>
          <nav className="grid gap-6 text-lg font-medium">
            <Logo />
             {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
                    {link.label}
                </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex w-full items-center gap-4 ml-auto justify-end">
        <div className="flex items-center gap-4">
          <span className="hidden md:inline-block text-sm font-semibold">
              Welcome, {user.name}
          </span>
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
                    <p className="text-sm font-medium leading-none">{user.name}</p>
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
                {/* Use a form to safely call the server action for logout */}
                <form action={logout} className="w-full">
                    <button type="submit" className="w-full text-left">
                        Log out
                    </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
