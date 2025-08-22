
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';
import type { User } from '@/lib/types';

// 1. Specify public routes
const publicRoutes = ['/login', '/signup'];

const userRoutes = ['/become-member', '/calculator'];
const memberRoutes = ['/dashboard', '/apply-loan', '/calculator', '/my-finances'];
const adminRoutes = ['/admin/dashboard', '/admin/audit', '/admin/users', '/admin/approvals'];
// Define board_member routes if they exist
// const boardMemberRoutes = ['/board/dashboard'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 2. Check if the current route is public
  const isPublicRoute = publicRoutes.includes(path);

  // 3. Decrypt the session from the cookie
  const cookie = await cookies().get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const user: User | null = session?.user ?? null;

  // 4. Redirect logged in users from public routes
  if (isPublicRoute && user) {
    let targetDashboard = '/become-member'; // Default for non-member users
    if (user.role === 'admin') {
      targetDashboard = '/admin/dashboard';
    } else if (user.role === 'member') {
      targetDashboard = '/dashboard';
    } else if (user.role === 'board_member') {
      targetDashboard = '/dashboard';
    }
    return NextResponse.redirect(new URL(targetDashboard, req.nextUrl));
  }

  // 5. Redirect unauthenticated users from protected routes
  if (!isPublicRoute && !user) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // 6. Role-based access control for protected routes
  if (!isPublicRoute && user) {
     const isGoingToAdminRoute = path.startsWith('/admin');
     const isGoingToMemberRoute = memberRoutes.includes(path);
     const isGoingToUserRoute = userRoutes.includes(path);

    if (user.role === 'user' && !isGoingToUserRoute && !path.startsWith('/my-finances')) {
        return NextResponse.redirect(new URL('/become-member', req.nextUrl));
    }
    if (user.role === 'member' && !isGoingToMemberRoute && !isGoingToUserRoute) {
        return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
    if (user.role === 'admin' && !isGoingToAdminRoute && !isGoingToMemberRoute && !isGoingToUserRoute) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
    }
    // Add board_member logic here if needed
  }


  return NextResponse.next();
}

// Match all routes except for static files and specific API routes.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
