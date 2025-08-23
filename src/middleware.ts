
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';
import type { User } from '@/lib/types';

const publicRoutes = ['/login', '/signup'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  // 1. Get the session from the cookie
  const cookie = cookies().get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const user: User | null = session?.user ?? null;

  // 2. Redirect logged-in users from public routes
  if (isPublicRoute && user) {
    const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return NextResponse.redirect(new URL(dashboardPath, req.nextUrl));
  }

  // 3. Redirect logged-out users from protected routes
  if (!isPublicRoute && !user) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }
  
  // 4. If none of the above, allow the request to continue
  return NextResponse.next();
}

// Match all routes except for static files and specific API routes.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
