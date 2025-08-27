
"use client";

import Link from "next/link";
import {
    LayoutDashboard,
    HandCoins,
    Wallet,
    Mail,
    Users,
    FileCheck,
    ShieldCheck,
    BookCopy,
    Settings,
    BarChart3,
    Landmark,
    LogOut,
    User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { logout } from "@/app/logout/actions";


const userNavLinks = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-5" /> },
  { href: "/apply-loan", label: "Apply for Loan", icon: <HandCoins className="size-5" /> },
  { href: "/my-finances", label: "My Finances", icon: <Wallet className="size-5" /> },
  { href: "/contact-us", label: "Contact Us", icon: <Mail className="size-5" /> },
];

const adminNavLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-5" /> },
    { href: "/admin/approvals", label: "Approvals", icon: <FileCheck className="size-5" /> },
    { href: "/admin/users", label: "Users", icon: <Users className="size-5" /> },
    { href: "/admin/ledger", label: "Loan Ledger", icon: <BookCopy className="size-5" /> },
    { href: "/admin/profit-loss", label: "Profit & Loss", icon: <BarChart3 className="size-5" /> },
    { href: "/admin/audit", label: "AI Auditor", icon: <ShieldCheck className="size-5" /> },
    { href: "/admin/settings", label: "Settings", icon: <Settings className="size-5" /> },
]


export function SidebarNav({ user, isMobile = false }: { user: User, isMobile?: boolean }) {
    const pathname = usePathname();
    const navLinks = user.role === 'admin' ? adminNavLinks : userNavLinks;

    const navItems = (
        <>
            {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                            pathname === link.href && "bg-muted text-primary",
                             isMobile && "text-lg"
                        )}
                    >
                        {link.icon}
                        {link.label}
                    </Link>
            ))}
        </>
    );

    if (isMobile) {
        return (
            <nav className="grid gap-2 text-lg font-medium">
                 <Link
                    href={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"}
                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                    >
                    <Landmark className="h-6 w-6" />
                    <span>Co-op Bank</span>
                </Link>
                {navItems}
            </nav>
        )
    }

    return (
        <nav className="grid items-start gap-1 px-2 text-sm font-medium">
            {navItems}
        </nav>
    );
}

export function Sidebar({ user }: { user: User }) {
    if (!user) return null;

    return (
        <div className="hidden md:flex flex-col h-screen border-r bg-muted/40 w-64 fixed">
            <div className="flex h-14 items-center border-b px-4">
                <Link href={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"} className="flex items-center gap-2 font-semibold">
                    <Landmark className="h-6 w-6" />
                    <span>Co-op Bank</span>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <SidebarNav user={user} />
            </div>
            <div className="mt-auto border-t p-2">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button variant="ghost" className="w-full justify-start text-left">
                         <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                                <AvatarImage src={user.photoUrl ?? undefined} alt={user.name ?? 'User'} />
                                <AvatarFallback>{user.name?.[0] ?? 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start max-w-28">
                                <p className="text-sm font-medium leading-none truncate">{user.name}</p>
                                <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                            </div>
                         </div>
                       </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="right" className="mb-2 w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/profile" className="flex items-center gap-2 cursor-pointer"><UserIcon /> Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                             <Link href="/settings" className="flex items-center gap-2 cursor-pointer"><Settings /> Settings</Link>
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
        </div>
    );
}
