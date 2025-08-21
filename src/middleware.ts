import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';

const protectedRoutes = ['/'];
const publicRoutes = ['/login', '/signup'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((prefix) => path.startsWith(prefix) && path !== '/login' && path !== '/signup' );

  // Redirect root to /dashboard if it's not the target
  if(path === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }
  const isPublicRoute = publicRoutes.includes(path);

  const sessionCookie = cookies().get('session')?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;
  
  if (isProtectedRoute && !session?.user) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
