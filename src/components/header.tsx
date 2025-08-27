
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
import { Menu, LayoutDashboard, HandCoins, Wallet, Mail, Users, FileCheck, ShieldCheck, BookCopy, Settings } from "lucide-react";

const userNavLinks = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
  { href: "/apply-loan", label: "Apply for Loan", icon: <HandCoins className="size-4" /> },
  { href: "/my-finances", label: "My Finances", icon: <Wallet className="size-4" /> },
  { href: "/contact-us", label: "Contact Us", icon: <Mail className="size-4" /> },
];

const adminNavLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
    { href: "/admin/approvals", label: "Approvals", icon: <FileCheck className="size-4" /> },
    { href: "/admin/users", label: "Users", icon: <Users className="size-4" /> },
    { href: "/admin/ledger", label: "Loan Ledger", icon: <BookCopy className="size-4" /> },
    { href: "/admin/audit", label: "AI Auditor", icon: <ShieldCheck className="size-4" /> },
    { href: "/admin/settings", label: "Settings", icon: <Settings className="size-4" /> },
]

export function Header({ user }: { user: User | null }) {
  if (!user) {
    return null;
  }
  
  const navLinks = user.role === 'admin' ? adminNavLinks : userNavLinks;

  return (
    <header className="sticky top-0 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6 z-50">
      
      {/* Mobile Menu Trigger (Left) */}
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
           <SheetHeader>
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">A list of links to navigate the site.</SheetDescription>
          </SheetHeader>
          <nav className="grid gap-6 text-base font-medium">
            <Logo />
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="flex items-center gap-4 text-muted-foreground hover:text-foreground">
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Desktop Logo & Nav (Left) */}
      <div className="hidden md:flex items-center gap-6">
        <Logo />
        <nav className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Logo (Center) */}
       <div className="md:hidden">
          <Logo />
      </div>

      {/* User Menu (Right) */}
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
