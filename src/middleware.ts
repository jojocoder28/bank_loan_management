
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';
import type { User } from '@/lib/types';

// 1. Specify public routes
const publicRoutes = ['/login', '/signup'];

// 2. Specify protected routes for each role
const userRoutes = ['/become-member', '/calculator', '/profile'];
const memberRoutes = ['/dashboard', '/apply-loan', '/my-finances', '/calculator', '/profile'];
const adminRoutes = ['/admin/dashboard', '/admin/audit', '/admin/users', '/admin/approvals'];
// Define board_member routes if they exist
// const boardMemberRoutes = ['/board/dashboard'];


export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  // 3. Decrypt the session from the cookie
  const cookie = await cookies().get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const user: User | null = session?.user ?? null;

  // 4. Redirect logged-in users from public routes
  if (isPublicRoute && user) {
    let targetPath = '/login';
    switch (user.role) {
      case 'admin':
        targetPath = '/admin/dashboard';
        break;
      case 'member':
        targetPath = '/dashboard';
        break;
      case 'board_member':
         targetPath = '/dashboard';
         break;
      case 'user':
        targetPath = user.membershipApplied ? '/calculator' : '/become-member';
        break;
    }
    return NextResponse.redirect(new URL(targetPath, req.nextUrl));
  }

  // 5. Redirect unauthenticated users from protected routes
  if (!isPublicRoute && !user) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // 6. Role-based access control for protected routes
  if (user && !isPublicRoute) {
    const allowedRoutes: string[] = [];
    let defaultRedirect = '/login';

    switch (user.role) {
      case 'admin':
        allowedRoutes.push(...adminRoutes, ...memberRoutes, ...userRoutes);
        defaultRedirect = '/admin/dashboard';
        break;
      case 'member':
        allowedRoutes.push(...memberRoutes, ...userRoutes);
        defaultRedirect = '/dashboard';
        break;
      case 'board_member':
        // Add specific board member routes if any, for now they get member access
        allowedRoutes.push(...memberRoutes, ...userRoutes, '/board/approvals');
        defaultRedirect = '/dashboard';
        break;
      case 'user':
        allowedRoutes.push(...userRoutes);
        defaultRedirect = user.membershipApplied ? '/calculator' : '/become-member';
        break;
    }

    // Check if the current path is allowed for the user's role
    // This logic handles dynamic routes like /admin/users/[id]
    const isPathAllowed = allowedRoutes.some(route => path.startsWith(route));
    
    if (!isPathAllowed) {
        // If not allowed, redirect to their default page
        return NextResponse.redirect(new URL(defaultRedirect, req.nextUrl));
    }
  }


  return NextResponse.next();
}

// Match all routes except for static files and specific API routes.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
