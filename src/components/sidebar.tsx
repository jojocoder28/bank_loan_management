
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
    Landmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";


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


export function SidebarNav({ user, isMobile = false, isCollapsed = false }: { user: User, isMobile?: boolean, isCollapsed?: boolean }) {
    const pathname = usePathname();
    const navLinks = user.role === 'admin' ? adminNavLinks : userNavLinks;

    const navItems = (
        <>
            {navLinks.map((link) => (
                isCollapsed ? (
                    <TooltipProvider key={link.href}>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Link
                                    href={link.href}
                                    className={cn(
                                        "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                                        pathname === link.href && "bg-accent text-accent-foreground"
                                    )}
                                >
                                    {link.icon}
                                    <span className="sr-only">{link.label}</span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">{link.label}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                            pathname === link.href && "bg-muted text-primary"
                        )}
                    >
                        {link.icon}
                        {link.label}
                    </Link>
                )
            ))}
        </>
    );

    if (isMobile) {
        return (
            <nav className="grid gap-2 text-lg font-medium">
                 <Link
                    href="#"
                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                    >
                    <Landmark className="h-6 w-6" />
                    <span className="sr-only">Co-op Bank</span>
                </Link>
                {navItems}
            </nav>
        )
    }

    return (
        <nav className={cn("grid items-start gap-2 px-2 text-sm font-medium lg:px-4", isCollapsed && "px-2 justify-center")}>
            {navItems}
        </nav>
    );
}

export function Sidebar({ user, isCollapsed }: { user: User | null, isCollapsed: boolean }) {
    if (!user) return null;

    return (
        <div className="hidden border-r bg-muted/40 md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <Landmark className="h-6 w-6" />
                        {!isCollapsed && <span>Co-op Bank</span>}
                        <span className="sr-only">Co-op Bank</span>
                    </Link>
                </div>
                <div className="flex-1">
                    <SidebarNav user={user} isCollapsed={isCollapsed} />
                </div>
            </div>
        </div>
    );
}
