
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

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/apply-loan", label: "Apply for Loan", icon: Handshake },
  { href: "/calculator", label: "Loan Calculator", icon: Calculator },
];

const adminNavItems = [
    { href: "/admin/audit", label: "AI Audit", icon: ShieldCheck },
    { href: "/admin/users", label: "Users", icon: Users },
]

const pageTitles: { [key: string]: string } = {
  "/dashboard": "Member Dashboard",
  "/apply-loan": "Apply for a New Loan",
  "/calculator": "Loan Payment Calculator",
  "/admin/audit": "AI Financial Auditor",
  "/admin/users": "User Management",
  "/login": "Login",
  "/signup": "Sign Up",
};

export function AppProvider({ children, user }: { children: React.ReactNode, user: User | null }) {
  const pathname = usePathname();
  const isAdmin = user?.role === 'admin';

  const getNavItems = () => {
    let items = [...navItems];
    if (isAdmin) {
      items = [...navItems, ...adminNavItems];
    }
    // Adjust for root redirection to dashboard if user is logged in
    const finalItems = items.map(item => ({...item, href: item.href === '/' ? '/dashboard' : item.href}));
    return finalItems;
  }
  
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAuthPage) {
    return <main className="flex-1">{children}</main>;
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
                  isActive={pathname === item.href}
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
              {pageTitles[pathname] || "Co-op Bank Manager"}
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
            <AvatarImage src={user.image ?? undefined} />
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
