import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';

// 1. Specify public routes
const publicRoutes = ['/login', '/signup'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 2. Check if the current route is public
  const isPublicRoute = publicRoutes.includes(path);

  // 3. Decrypt the session from the cookie
  const cookie = cookies().get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;

  // 4. Redirect logged in users from public routes to the dashboard
  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  // 5. Redirect unauthenticated users from protected routes to the login page
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  return NextResponse.next();
}

// Match all routes except for static files and specific API routes.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
