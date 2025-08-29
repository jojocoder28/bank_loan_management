
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
    PanelLeftClose,
    PanelRightClose,
    FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { logout } from "@/app/logout/actions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { ThemeToggle } from "./theme-toggle";


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
    { href: "/admin/statement", label: "Monthly Statement", icon: <FileText className="size-5" /> },
    { href: "/admin/audit", label: "AI Auditor", icon: <ShieldCheck className="size-5" /> },
    { href: "/admin/settings", label: "Settings", icon: <Settings className="size-5" /> },
]

export function SidebarNav({ user, isMobile = false, isCollapsed = false }: { user: User, isMobile?: boolean, isCollapsed?: boolean }) {
    const pathname = usePathname();
    
    let navLinks;

    if (user.role === 'admin') {
        navLinks = adminNavLinks;
    } else if (user.role === 'member' || user.role === 'board_member') {
        navLinks = userNavLinks;
    } else { // 'user' role (non-member)
        navLinks = userNavLinks.filter(link => 
            link.href === '/dashboard' || link.href === '/contact-us'
        );
    }


    const navItems = (
      <TooltipProvider>
        {navLinks.map((link) => (
          isCollapsed ? (
            <Tooltip key={link.href} delayDuration={0}>
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
      </TooltipProvider>
    );

    if (isMobile) {
        return (
            <nav className="grid gap-2 text-lg font-medium">
                 <Link
                    href={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"}
                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                    >
                    <Landmark className="h-6 w-6" />
                    <span>S&KGPPS Co-op</span>
                </Link>
                {navItems}
            </nav>
        )
    }

    return (
        <nav className={cn(
            "grid items-start gap-1 px-2 text-sm font-medium",
            isCollapsed && "flex flex-col items-center"
        )}>
            {navItems}
        </nav>
    );
}

export function Sidebar({ user, isCollapsed, setIsCollapsed }: { user: User, isCollapsed: boolean, setIsCollapsed: (isCollapsed: boolean) => void }) {
    if (!user) return null;

    return (
        <div className={cn(
            "hidden md:flex flex-col h-screen border-r bg-muted/40 fixed transition-all duration-300",
            isCollapsed ? "w-20" : "w-64"
        )}>
             <div className={cn(
                "flex h-14 items-center border-b px-4",
                !isCollapsed && "justify-between"
             )}>
                <Link href={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"} 
                    className={cn(
                        "flex items-center gap-2 font-semibold",
                        isCollapsed && "justify-center w-full"
                    )}
                >
                    <Landmark className="h-6 w-6" />
                    <span className={cn(isCollapsed && "hidden")}>S&KGPPS Co-op</span>
                </Link>
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={cn(isCollapsed && "hidden")}
                  >
                    <PanelLeftClose className="size-5" />
                    <span className="sr-only">Collapse Sidebar</span>
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <SidebarNav user={user} isCollapsed={isCollapsed} />
            </div>

            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                    "absolute top-1/2 -right-5 transform -translate-y-1/2 hidden md:inline-flex",
                    !isCollapsed && "hidden"
                )}
              >
                <PanelRightClose className="size-5" />
                <span className="sr-only">Expand Sidebar</span>
            </Button>


            <div className="mt-auto border-t p-2">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button variant="ghost" className={cn(
                           "w-full justify-start text-left",
                           isCollapsed && "justify-center size-12"
                       )}>
                         <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                                <AvatarImage src={user.photoUrl ?? undefined} alt={user.name ?? 'User'} />
                                <AvatarFallback>{user.name?.[0] ?? 'U'}</AvatarFallback>
                            </Avatar>
                            <div className={cn(
                                "flex flex-col items-start max-w-28",
                                isCollapsed && "hidden"
                            )}>
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
        </div>
    );
}
