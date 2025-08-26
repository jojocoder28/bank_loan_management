
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  LayoutDashboard,
  ShieldCheck,
  Users,
  LogOut,
  Handshake,
  UserCheck,
  UserPlus,
  FileText,
  User as UserIcon,
  Menu,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import type { User } from "@/lib/types";
import { logout } from "@/app/logout/actions";

const userNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/apply-loan", label: "Apply for Loan", icon: Handshake },
  { href: "/calculator", label: "Loan Calculator", icon: Calculator },
  { href: "/become-member", label: "Become a Member", icon: UserPlus },
];

const memberNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-finances", label: "My Finances", icon: FileText },
  { href: "/apply-loan", label: "Apply for Loan", icon: Handshake },
  { href: "/calculator", label: "Loan Calculator", icon: Calculator },
];

const adminNavItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/approvals", label: "Approvals", icon: UserCheck },
    { href: "/admin/audit", label: "AI Audit", icon: ShieldCheck },
];

const boardMemberNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, 
    { href: "/board/approvals", label: "Loan Approvals", icon: UserCheck },
]

export function Header({ user }: { user: User | null }) {
    const pathname = usePathname();

    const getNavItems = () => {
        if (!user) return [];
        switch (user.role) {
          case 'admin':
            return adminNavItems;
          case 'board_member':
            return boardMemberNavItems;
          case 'member':
             return memberNavItems;
          case 'user':
            return userNavItems;
          default:
            return [];
        }
    }
    const navItems = getNavItems();
    
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <Link href={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2 text-lg font-semibold md:text-base">
                    <Logo />
                    <span className="sr-only">Co-op Bank</span>
                </Link>
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                            "transition-colors hover:text-foreground",
                            pathname === item.href ? "text-foreground" : "text-muted-foreground"
                        )}
                    >
                    {item.label}
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
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <SheetDescription className="sr-only">A list of navigation links for the site.</SheetDescription>
                    <nav className="grid gap-6 text-lg font-medium">
                        <Link
                            href={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                            className="flex items-center gap-2 text-lg font-semibold"
                        >
                            <Logo />
                            <span className="sr-only">Co-op Bank</span>
                        </Link>
                         {navItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "hover:text-foreground",
                                     pathname === item.href ? "text-foreground" : "text-muted-foreground"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </SheetContent>
            </Sheet>
            <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <UserMenu user={user} />
            </div>
      </header>
    )
}


function UserMenu({ user }: { user: User | null }) {
    if (!user) {
        return (
            <Button asChild>
                <Link href="/login">Login</Link>
            </Button>
        );
    }
    
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoUrl ?? undefined} />
            <AvatarFallback>{user.name?.[0]}</AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
            <Link href="/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
            </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
            Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
