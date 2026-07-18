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
    FileText,
    Gift,
    UploadCloud,
    Download,
    ChevronRight,
    ShieldAlert,
    Sparkles,
    PanelLeftClose,
    PanelRightClose,
    TrendingUp,
    Layers,
    Cog,
    DatabaseZap,
    Handshake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { UserNav } from "./user-nav";
import { getPendingApprovalCount } from "@/app/admin/approvals/actions";
import React from "react";
import { Badge } from "./ui/badge";
import { Logo } from "./logo";


const userNavLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { href: "/apply-loan", label: "Apply for Loan", icon: HandCoins, group: "main" },
  { href: "/my-finances", label: "My Finances", icon: Wallet, group: "main" },
  { href: "/contact-us", label: "Contact Us", icon: Mail, group: "main" },
];

const adminNavGroups = [
  {
    label: "Overview",
    icon: Layers,
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/approvals", label: "Approvals", icon: FileCheck },
      { href: "/admin/users", label: "Members", icon: Users },
    ],
  },
  {
    label: "Finance",
    icon: TrendingUp,
    items: [
      { href: "/admin/ledger", label: "Loan Ledger", icon: BookCopy },
      { href: "/admin/profit-loss", label: "Profit & Loss", icon: BarChart3 },
      { href: "/admin/statement", label: "Monthly Statement", icon: FileText },
      { href: "/admin/dividend", label: "Dividends", icon: Gift },
      { href: "/admin/fund-compliance", label: "Fund Compliance", icon: ShieldAlert },
      { href: "/admin/settlements", label: "Settlements", icon: Handshake },
    ],
  },
  {
    label: "Management",
    icon: DatabaseZap,
    items: [
      { href: "/admin/data-export", label: "Data Export", icon: Download },
      { href: "/admin/audit", label: "AI Auditor", icon: ShieldCheck },
      { href: "/admin/bulk-import", label: "Bulk Import", icon: UploadCloud },
    ],
  },
  {
    label: "System",
    icon: Cog,
    items: [
      { href: "/admin/homepage", label: "Homepage", icon: Sparkles },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];


/* ── Shared nav item (collapsed icon-only) ── */
function CollapsedNavItem({ href, label, icon: Icon, isActive, showBadge, approvalCount, onLinkClick }: {
  href: string; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  isActive: boolean; showBadge?: boolean; approvalCount?: number; onLinkClick?: () => void;
}) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Link
          href={href}
          onClick={onLinkClick}
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
            isActive
              ? "bg-gradient-to-br from-[hsl(var(--gold)_/_0.25)] to-[hsl(var(--gold)_/_0.1)] text-[hsl(var(--gold))] shadow-md"
              : "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-muted/60"
          )}
        >
          <Icon className="size-4.5" strokeWidth={isActive ? 2.25 : 1.75} />
          {showBadge && approvalCount && approvalCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[hsl(var(--gold))] text-[9px] font-bold text-[hsl(var(--gold-foreground))] shadow">
              {approvalCount > 9 ? "9+" : approvalCount}
            </span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-medium">{label}</TooltipContent>
    </Tooltip>
  );
}


/* ── Full sidebar nav item ── */
function NavItem({ href, label, icon: Icon, isActive, showBadge, approvalCount, onLinkClick }: {
  href: string; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  isActive: boolean; showBadge?: boolean; approvalCount?: number; onLinkClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onLinkClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 overflow-hidden",
        isActive
          ? "bg-gradient-to-r from-[hsl(var(--gold)_/_0.18)] to-[hsl(var(--primary)_/_0.08)] text-sidebar-foreground"
          : "text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-muted/50"
      )}
    >
      {/* Active left bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-gradient-to-b from-[hsl(var(--gold))] to-[hsl(var(--primary))]" />
      )}

      {/* Icon */}
      <span className={cn(
        "flex items-center justify-center size-8 rounded-lg shrink-0 transition-all duration-200",
        isActive
          ? "bg-gradient-to-br from-[hsl(var(--gold)_/_0.3)] to-[hsl(var(--primary)_/_0.2)] text-[hsl(var(--gold))] shadow-sm"
          : "bg-sidebar-muted/50 text-sidebar-muted-foreground group-hover:bg-sidebar-muted group-hover:text-sidebar-foreground"
      )}>
        <Icon className="size-4" strokeWidth={isActive ? 2.25 : 1.75} />
      </span>

      <span className={cn(
        "flex-1 text-[13px] font-medium leading-none",
        isActive ? "text-sidebar-foreground" : ""
      )}>
        {label}
      </span>

      {showBadge && approvalCount && approvalCount > 0 && (
        <span className="flex items-center justify-center min-w-5 h-5 rounded-full bg-[hsl(var(--gold))] text-[hsl(var(--gold-foreground))] text-[10px] font-bold px-1.5 shadow-sm">
          {approvalCount > 9 ? "9+" : approvalCount}
        </span>
      )}

      {isActive && <ChevronRight className="size-3.5 text-[hsl(var(--gold)_/_0.7)] shrink-0" />}
    </Link>
  );
}


/* ── Mobile drawer link ── */
function MobileNavItem({ href, label, icon: Icon, isActive, showBadge, approvalCount, onLinkClick }: {
  href: string; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  isActive: boolean; showBadge?: boolean; approvalCount?: number; onLinkClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onLinkClick}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-[hsl(var(--gold)_/_0.15)] to-[hsl(var(--primary)_/_0.08)] text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      )}
    >
      <span className={cn(
        "flex items-center justify-center size-9 rounded-xl transition-all duration-200 shrink-0",
        isActive
          ? "bg-gradient-to-br from-[hsl(var(--gold)_/_0.35)] to-[hsl(var(--primary)_/_0.2)] text-[hsl(var(--gold))] shadow-md shadow-[hsl(var(--gold)_/_0.2)]"
          : "bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
      )}>
        <Icon className="size-4.5" strokeWidth={isActive ? 2.25 : 1.75} />
      </span>

      <span className="flex-1 text-[13.5px] font-semibold">{label}</span>

      {showBadge && approvalCount && approvalCount > 0 && (
        <span className="flex items-center justify-center min-w-5 h-5 rounded-full bg-[hsl(var(--gold))] text-[hsl(var(--gold-foreground))] text-[10px] font-bold px-1.5 shadow-sm">
          {approvalCount > 9 ? "9+" : approvalCount}
        </span>
      )}
      {isActive && <ChevronRight className="size-4 text-[hsl(var(--gold)_/_0.6)] shrink-0" />}
    </Link>
  );
}


/* ── Public Nav API ── */
export function SidebarNav({
  user,
  isMobile = false,
  isCollapsed = false,
  approvalCount = 0,
  onLinkClick,
}: {
  user: User;
  isMobile?: boolean;
  isCollapsed?: boolean;
  approvalCount?: number;
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();

  if (user.role === "admin") {
    /* Admin: grouped nav */
    if (isCollapsed) {
      /* Collapsed — flat icon list */
      const allAdminItems = adminNavGroups.flatMap(g => g.items);
      return (
        <TooltipProvider>
          <nav className="flex flex-col items-center gap-1 px-1">
            {allAdminItems.map(link => (
              <CollapsedNavItem
                key={link.href}
                href={link.href}
                label={link.label}
                icon={link.icon}
                isActive={pathname.startsWith(link.href)}
                showBadge={link.href === "/admin/approvals"}
                approvalCount={approvalCount}
                onLinkClick={onLinkClick}
              />
            ))}
          </nav>
        </TooltipProvider>
      );
    }

    return (
      <nav className="flex flex-col gap-4 px-3">
        {adminNavGroups.map(group => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted-foreground/60">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(link => {
                const ItemCmp = isMobile ? MobileNavItem : NavItem;
                return (
                  <ItemCmp
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    icon={link.icon}
                    isActive={pathname.startsWith(link.href)}
                    showBadge={link.href === "/admin/approvals"}
                    approvalCount={approvalCount}
                    onLinkClick={onLinkClick}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    );
  }

  /* Member / Board member nav */
  const links = (user.role === "member" || user.role === "board_member")
    ? userNavLinks
    : userNavLinks.filter(l => l.href !== "/apply-loan");

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-1 px-1">
          {links.map(link => (
            <CollapsedNavItem
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              isActive={pathname.startsWith(link.href)}
              onLinkClick={onLinkClick}
            />
          ))}
        </nav>
      </TooltipProvider>
    );
  }

  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {links.map(link => {
        const ItemCmp = isMobile ? MobileNavItem : NavItem;
        return (
          <ItemCmp
            key={link.href}
            href={link.href}
            label={link.label}
            icon={link.icon}
            isActive={pathname.startsWith(link.href)}
            onLinkClick={onLinkClick}
          />
        );
      })}
    </nav>
  );
}


/* ═══════════════════════════════════════════════════
   SIDEBAR SHELL
═══════════════════════════════════════════════════ */
export function Sidebar({
  user,
  isCollapsed,
  setIsCollapsed,
}: {
  user: User;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}) {
  const [approvalCount, setApprovalCount] = React.useState(0);

  const fetchApprovalCount = React.useCallback(() => {
    if (user.role === "admin") {
      getPendingApprovalCount().then(setApprovalCount);
    }
  }, [user.role]);

  React.useEffect(() => {
    fetchApprovalCount();
    const handler = () => fetchApprovalCount();
    window.addEventListener("approvalCountChanged", handler);
    const id = setInterval(fetchApprovalCount, 30000);
    return () => {
      window.removeEventListener("approvalCountChanged", handler);
      clearInterval(id);
    };
  }, [fetchApprovalCount]);

  if (!user) return null;

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen fixed z-50 transition-all duration-300 ease-in-out glass-sidebar",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* ── Logo header ── */}
      <div className={cn(
        "flex h-16 items-center border-b border-sidebar-border/60 shrink-0",
        isCollapsed ? "justify-center px-0" : "justify-between px-4"
      )}>
        <Link
          href={user.role === "admin" ? "/admin/dashboard" : "/dashboard"}
          className="flex items-center gap-0 min-w-0"
        >
          <Logo collapsed={isCollapsed} showText={!isCollapsed} size="md" />
        </Link>

        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-muted/50 rounded-xl shrink-0"
          >
            <PanelLeftClose className="size-4.5" />
          </Button>
        )}
      </div>

      {/* ── User card ── */}
      {!isCollapsed && (
        <div className="px-4 pt-4 pb-2 shrink-0">
          <UserNav user={user} isCollapsed={false} />
        </div>
      )}
      {isCollapsed && (
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <UserNav user={user} isCollapsed={true} />
        </div>
      )}

      {/* ── Nav links ── */}
      <div className="flex-1 overflow-y-auto py-3 scrollbar-none">
        <SidebarNav
          user={user}
          isCollapsed={isCollapsed}
          approvalCount={approvalCount}
        />
      </div>

      {/* ── Expand toggle (when collapsed) ── */}
      {isCollapsed && (
        <div className="flex justify-center pb-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(false)}
            className="text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-muted/50 rounded-xl"
          >
            <PanelRightClose className="size-4.5" />
          </Button>
        </div>
      )}

      {/* ── Bottom gradient fade ── */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-sidebar to-transparent pointer-events-none" />
    </aside>
  );
}
