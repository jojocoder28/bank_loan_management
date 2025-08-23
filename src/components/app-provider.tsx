
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Calculator,
  LayoutDashboard,
  PanelLeft,
  ShieldCheck,
  Users,
  LogIn,
  LogOut,
  Handshake,
  UserCheck,
  UserPlus,
  FileText,
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
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import type { User } from "@/lib/types";
import { logout } from "@/app/logout/actions";

const userNavItems = [
  { href: "/become-member", label: "Become a Member", icon: UserPlus },
  { href: "/calculator", label: "Loan Calculator", icon: Calculator },
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
    { href: "/dashboard", label: "Member View", icon: LayoutDashboard }, // Can see what a member sees
    { href: "/board/approvals", label: "Loan Approvals", icon: UserCheck },
]

const pageTitles: { [key: string]: string | ((pathname: string) => string) } = {
  "/dashboard": "Member Dashboard",
  "/my-finances": "My Finances",
  "/apply-loan": "Apply for a New Loan",
  "/calculator": "Loan Payment Calculator",
  "/become-member": "Become a Member",
  "/admin/dashboard": "Admin Dashboard",
  "/admin/audit": "AI Financial Auditor",
  "/admin/users": "User Management",
  "/admin/users/add": "Add New User",
  "/admin/users/[id]": (pathname) => "User Details",
  "/admin/approvals": "Approvals",
  "/board/approvals": "Loan Approvals",
  "/login": "Login",
  "/signup": "Sign Up",
};

export function AppProvider({ children, user }: { children: React.ReactNode, user: User | null }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAuthPage) {
    return <main className="flex-1">{children}</main>;
  }
  
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
         const navs = userNavItems;
         // If user has applied, don't show "Become a member"
         if (user.membershipApplied) {
            return navs.filter(item => item.href !== '/become-member');
         }
         return navs;
      default:
        return user.membershipApplied ? userNavItems.filter(item => item.href !== '/become-member') : userNavItems;
    }
  }
  
  const getPageTitle = (path: string): string => {
    // Exact match
    if (pageTitles[path]) {
      const title = pageTitles[path];
      return typeof title === 'function' ? title(path) : title;
    }

    // Dynamic route match (e.g., /admin/users/[id])
    const dynamicRoute = Object.keys(pageTitles).find(key => {
        const regex = new RegExp(`^${key.replace(/\[.*?\]/g, '[^/]+')}$`);
        return regex.test(path);
    });

    if (dynamicRoute) {
        const title = pageTitles[dynamicRoute];
        return typeof title === 'function' ? title(path) : title;
    }
    
    return "Co-op Bank Manager";
  }


  return (
    <SidebarProvider>
      <Sidebar
        variant="sidebar"
        collapsible="icon"
        className="border-sidebar-border"
      >
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {getNavItems().map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href) && (item.href !== '/admin/dashboard' || pathname === item.href)}
                  tooltip={{ children: item.label }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <UserMenu user={user}/>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <SidebarTrigger>
              <PanelLeft />
            </SidebarTrigger>
            <Logo />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold font-headline">
              {getPageTitle(pathname)}
            </h1>
          </div>
          <div className="hidden md:block">
            <UserMenu user={user} />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function UserMenu({ user }: { user: User | null }) {
    
    if (!user) {
        return (
            <SidebarMenuButton asChild className="w-full justify-start">
                <Link href="/login">
                    <LogIn/>
                    <span>Login</span>
                </Link>
            </SidebarMenuButton>
        );
    }
    
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoUrl ?? undefined} />
            <AvatarFallback>{user.name?.[0]}</AvatarFallback>
          </Avatar>
          <span className="truncate">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-56">
        <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()}>
            <LogOut className="mr-2" />
            Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
