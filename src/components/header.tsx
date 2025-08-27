
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
import { Menu, LayoutDashboard, HandCoins, Wallet, Mail, Users, FileCheck, ShieldCheck, BookCopy, Settings, BarChart3 } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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
    { href: "/admin/profit-loss", label: "Profit & Loss", icon: <BarChart3 className="size-4" /> },
    { href: "/admin/audit", label: "AI Auditor", icon: <ShieldCheck className="size-4" /> },
    { href: "/admin/settings", label: "Settings", icon: <Settings className="size-4" /> },
]

export function Header({ user }: { user: User | null }) {
  const pathname = usePathname();
  if (!user) {
    return null;
  }
  
  const navLinks = user.role === 'admin' ? adminNavLinks : userNavLinks;

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="#"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Logo />
        </Link>
        {navLinks.map(link => (
           <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-1 transition-colors hover:text-foreground",
              pathname === link.href ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {link.icon}
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
          <nav className="grid gap-6 text-lg font-medium">
             <Link
              href="#"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Logo />
            </Link>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname === link.href && "text-primary bg-muted"
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center gap-4 md:ml-auto md:flex-initial">
        <div className="ml-auto flex-1 sm:flex-initial" />
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
