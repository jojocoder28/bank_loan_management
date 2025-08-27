
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
    ChevronsLeft,
    ChevronsRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
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


export function SidebarNav({ user, isMobile = false, isCollapsed = false }: { user: User, isMobile?: boolean, isCollapsed?: boolean }) {
    const pathname = usePathname();
    const navLinks = user.role === 'admin' ? adminNavLinks : userNavLinks;

    const navItems = (
        <>
            {navLinks.map((link) => (
                isCollapsed && !isMobile ? (
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
                            pathname === link.href && "bg-muted text-primary",
                             isMobile && "text-lg"
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
        <nav className={cn("grid items-start gap-1 px-2 text-sm font-medium", isCollapsed && "justify-center")}>
            {navItems}
        </nav>
    );
}

export function Sidebar({ user, isCollapsed, toggleSidebar }: { user: User, isCollapsed: boolean, toggleSidebar: () => void }) {
    if (!user) return null;

    return (
        <div className={cn("hidden md:flex flex-col h-screen border-r bg-muted/40 transition-all duration-300", isCollapsed ? "w-20" : "w-64")}>
            <div className="flex h-14 items-center border-b px-4">
                <Link href={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"} className="flex items-center gap-2 font-semibold">
                    <Landmark className="h-6 w-6" />
                    {!isCollapsed && <span className="transition-opacity duration-300">Co-op Bank</span>}
                </Link>
                <Button variant="ghost" size="icon" className="ml-auto" onClick={toggleSidebar}>
                    {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <SidebarNav user={user} isCollapsed={isCollapsed} />
            </div>
            <div className="mt-auto border-t p-2">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button variant="ghost" className={cn("w-full justify-start text-left", isCollapsed && "justify-center size-12")}>
                         <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                                <AvatarImage src={user.photoUrl ?? undefined} alt={user.name ?? 'User'} />
                                <AvatarFallback>{user.name?.[0] ?? 'U'}</AvatarFallback>
                            </Avatar>
                            {!isCollapsed && 
                                <div className="flex flex-col items-start max-w-28">
                                    <p className="text-sm font-medium leading-none truncate">{user.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                                </div>
                            }
                         </div>
                       </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="right" className="mb-2">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/profile" className="flex items-center gap-2"><UserIcon /> Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                             <Link href="/settings" className="flex items-center gap-2"><Settings /> Settings</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                         <DropdownMenuItem asChild>
                            <form action={logout} className="w-full">
                                <button type="submit" className="w-full text-left flex items-center gap-2">
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
