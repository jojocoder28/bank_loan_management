
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


export function SidebarNav({ user, isMobile = false }: { user: User, isMobile?: boolean }) {
    const pathname = usePathname();
    const navLinks = user.role === 'admin' ? adminNavLinks : userNavLinks;
    const linkClass = isMobile 
        ? "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
        : "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary";
    const activeLinkClass = isMobile ? "text-foreground" : "bg-muted text-primary";


    return (
        <nav className={cn("grid items-start text-sm font-medium", isMobile && "gap-y-4 text-base mt-4")}>
            <Link
              href={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"}
              className={cn("flex items-center gap-2 font-semibold text-foreground mb-4", isMobile && "px-2.5")}
            >
              <Landmark className="h-6 w-6" />
              <span className="">Co-op Bank</span>
            </Link>
            {navLinks.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn(linkClass, pathname === link.href && activeLinkClass)}
                >
                    {link.icon}
                    {link.label}
                </Link>
            ))}
        </nav>
    );
}

export function Sidebar({ user }: { user: User | null }) {
    if (!user) return null;

    return (
        <div className="hidden border-r bg-background md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex-1">
                    <SidebarNav user={user} />
                </div>
            </div>
        </div>
    );
}
