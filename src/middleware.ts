
import { NextRequest, NextResponse } from 'next/server';
import { decrypt, encrypt } from '@/lib/session';
import { cookies } from 'next/headers';
import type { User } from '@/lib/types';

const publicRoutes = ['/login', '/signup'];
const adminRoutes = ['/admin/dashboard', '/admin/approvals', '/admin/users', '/admin/audit', '/admin/ledger', '/admin/settings', '/admin/profit-loss'];
const userRoutes = ['/dashboard', '/apply-loan', '/my-finances', '/become-member'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);
  
  // Normalize path for dynamic routes like /admin/users/[id]
  const normalizedPath = path.split('/').slice(0, 3).join('/');

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
  
  if (user) {
      // 4. Protect admin routes from non-admin users
      if ((adminRoutes.includes(path) || normalizedPath === '/admin/users') && user.role !== 'admin') {
          return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
      }

      // 5. Protect user routes from admin users
      if (userRoutes.includes(path) && user.role === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
      }
  }

  // 6. Refresh the session if it's about to expire
  if (session?.exp) {
      const now = Date.now();
      const expires = session.exp * 1000;
      if (expires - now < 15 * 60 * 1000) { // Less than 15 minutes left
          const newExpires = new Date(now + 60 * 60 * 1000); // 1 hour from now
          const newSessionToken = await encrypt({ user: session.user, exp: newExpires.getTime() / 1000 });
          
          const response = NextResponse.next();
          response.cookies.set('session', newSessionToken, {
              expires: newExpires,
              httpOnly: true,
          });
          return response;
      }
  }
  
  // 7. If none of the above, allow the request to continue
  return NextResponse.next();
}

// Match all routes except for static files and specific API routes.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
