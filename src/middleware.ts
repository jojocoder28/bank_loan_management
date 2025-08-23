
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';
import type { User } from '@/lib/types';

const publicRoutes = ['/login', '/signup'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = cookies().get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const user: User | null = session?.user ?? null;

  if (isPublicRoute && user) {
    const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return NextResponse.redirect(new URL(dashboardPath, req.nextUrl));
  }

  if (!isPublicRoute && !user) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  return NextResponse.next();
}

// Match all routes except for static files and specific API routes.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
