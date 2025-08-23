
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';
import type { User } from '@/lib/types';

// 1. Specify public routes that do not require authentication.
const publicRoutes = ['/login', '/signup'];

const getDashboardPath = (user: User | null): string => {
    if (!user) return '/login';
    switch (user.role) {
        case 'admin':
            return '/admin/dashboard';
        case 'member':
            return '/dashboard';
        case 'board_member':
            return '/dashboard';
        case 'user':
            return user.membershipApplied ? '/calculator' : '/become-member';
        default:
            return '/login';
    }
}

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  // 2. Decrypt the session from the cookie
  const cookie = await cookies().get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const user: User | null = session?.user ?? null;

  // 3. Handle redirects
  if (isPublicRoute && user) {
    // If the user is logged in and tries to access a public route (like /login),
    // redirect them to their appropriate dashboard.
    return NextResponse.redirect(new URL(getDashboardPath(user), req.nextUrl));
  }
  
  if (!isPublicRoute && !user) {
    // If the user is not logged in and tries to access a protected route,
    // redirect them to the login page.
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }
  
  // 4. If none of the above conditions are met, continue to the requested page.
  return NextResponse.next();
}

// Match all routes except for static files and specific API routes.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
