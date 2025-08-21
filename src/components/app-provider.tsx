
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
  User,
  LogIn,
  LogOut,
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
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calculator", label: "Loan Calculator", icon: Calculator },
];

const adminNavItems = [
    { href: "/admin/audit", label: "AI Audit", icon: ShieldCheck },
    { href: "/admin/users", label: "Users", icon: Users },
]

const pageTitles: { [key: string]: string } = {
  "/": "Member Dashboard",
  "/calculator": "Loan Calculator",
  "/admin/audit": "AI Financial Auditor",
  "/admin/users": "User Management",
  "/login": "Login",
  "/signup": "Sign Up",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  const getNavItems = () => {
    let items = [...navItems];
    if (isAdmin) {
      items = [...items, ...adminNavItems];
    }
    return items;
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
          <UserMenu />
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
              {pageTitles[pathname] || "CoopLoan Manager"}
            </h1>
          </div>
          <div className="hidden md:block">
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function UserMenu() {
    const { data: session, status } = useSession();
    const user = session?.user;

    if (status === "loading") {
        return <Button variant="ghost" className="w-full justify-start">Loading...</Button>;
    }

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
        <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2" />
            Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
