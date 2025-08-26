'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import {
  Menu,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import type { User } from '@/lib/types';
import { logout } from '@/app/logout/actions';

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/approvals', label: 'Approvals' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/audit', label: 'AI Auditor' },
];

const memberNavItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/apply-loan', label: 'Apply for Loan' },
    { href: '/my-finances', label: 'My Finances' },
    { href: '/calculator', label: 'Loan Calculator' },
];

const userNavItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/apply-loan', label: 'Apply for Loan' },
    { href: '/my-finances', label: 'My Finances' },
    { href: '/calculator', label: 'Loan Calculator' },
];

function getNavItems(role: User['role']) {
  switch (role) {
    case 'admin':
      return adminNavItems;
    case 'member':
      return memberNavItems;
    case 'user':
        return userNavItems;
    case 'board_member':
        return memberNavItems; // Assuming board members have same nav as members
    default:
      return [];
  }
}

export function Header({ user }: { user: User | null }) {
  const pathname = usePathname();

  if (!user) {
    return null;
  }

  const navItems = getNavItems(user.role);

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Logo />
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'transition-colors hover:text-foreground',
              pathname === item.href
                ? 'text-foreground'
                : 'text-muted-foreground'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">A list of navigation links for the site.</SheetDescription>
          <nav className="grid gap-6 text-lg font-medium">
            <Logo />
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-foreground',
                  pathname === item.href
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar>
                  <AvatarImage src={user.photoUrl} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/profile"><UserIcon className="mr-2" /> Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
             <form action={logout}>
                <DropdownMenuItem asChild>
                    <button type="submit" className="w-full">
                        <LogOut className="mr-2" /> Logout
                    </button>
                </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
