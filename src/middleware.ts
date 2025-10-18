
import { NextRequest, NextResponse } from 'next/server';
import { decrypt, encrypt } from '@/lib/session';
import { cookies } from 'next/headers';
import type { User } from '@/lib/types';

const publicRoutes = ['/login', '/signup', '/public/data-entry', '/force-password-change'];
const adminRoutes = ['/admin/dashboard', '/admin/approvals', '/admin/users', '/admin/audit', '/admin/ledger', '/admin/settings', '/admin/profit-loss', '/admin/bulk-import', '/admin/data-export', '/admin/statement'];
const userRoutes = ['/dashboard', '/apply-loan', '/my-finances', '/become-member'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
  
  // Normalize path for dynamic routes like /admin/users/[id]
  const normalizedPath = path.split('/').slice(0, 3).join('/');

  // 1. Get the session from the cookie
  const cookie = cookies().get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const user: User | null = session?.user ?? null;

  // 2. Handle mandatory password change
  if (user?.requiresPasswordChange && path !== '/force-password-change') {
    return NextResponse.redirect(new URL('/force-password-change', req.nextUrl));
  }
  // If user does not need password change but is on the change page, redirect away
  if (user && !user.requiresPasswordChange && path === '/force-password-change') {
    const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return NextResponse.redirect(new URL(dashboardPath, req.nextUrl));
  }

  // 3. Redirect logged-in users from public routes
  if (isPublicRoute && user && path !== '/force-password-change') {
    const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return NextResponse.redirect(new URL(dashboardPath, req.nextUrl));
  }

  // 4. Redirect logged-out users from protected routes
  if (!isPublicRoute && !user) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }
  
  if (user) {
      // 5. Protect admin routes from non-admin users
      if ((adminRoutes.includes(path) || adminRoutes.includes(normalizedPath) || path.startsWith('/admin/users/')) && user.role !== 'admin') {
          return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
      }

      // 6. Protect user routes from admin users
      if (userRoutes.includes(path) && user.role === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
      }
  }

  // 7. Refresh the session if it's about to expire
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
  
  // 8. If none of the above, allow the request to continue
  return NextResponse.next();
}

// Match all routes except for static files and specific API routes.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|verify-email).*)'],
};
