
import { NextRequest, NextResponse } from 'next/server';
import { decrypt, encrypt } from '@/lib/session';
import { cookies } from 'next/headers';
import type { User } from '@/lib/types';

// Rate Limiting Map (in-memory per instance cleanup)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string, limit = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(ip);

  // Periodic memory cleanup
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  clientData.count += 1;
  return clientData.count > limit;
}

function isScraperBot(userAgent: string | null): boolean {
  if (!userAgent) return true; // Block anonymous requests without UA (standard curl/python scraper behavior)
  const botKeywords = [
    'bot', 'crawler', 'spider', 'scrap', 'python', 'curl', 'wget', 
    'selenium', 'puppeteer', 'playwright', 'headless', 'postman', 
    'insomnia', 'http-client', 'axios', 'got', 'node-fetch', 
    'cheerio', 'scrapy', 'urllib', 'perl', 'libwww', 'java', 
    'lwp-trivial', 'httpclient', 'apache-httpclient', 'scrapy-redis',
    'sqlmap', 'nmap', 'dirbuster', 'nikto'
  ];
  const uaLower = userAgent.toLowerCase();
  if (uaLower.includes('vercel')) return false; // Allow Vercel build/preview operations
  return botKeywords.some(keyword => uaLower.includes(keyword));
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  return res;
}

const publicRoutes = ['/login', '/signup', '/public/data-entry', '/force-password-change'];
const adminRoutes = ['/admin/dashboard', '/admin/approvals', '/admin/users', '/admin/audit', '/admin/ledger', '/admin/settings', '/admin/profit-loss', '/admin/bulk-import', '/admin/data-export', '/admin/statement'];
const userRoutes = ['/dashboard', '/apply-loan', '/my-finances', '/become-member'];

export default async function middleware(req: NextRequest) {
  const userAgent = req.headers.get('user-agent');
  const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';

  // 1. Web scraper mitigation
  if (isScraperBot(userAgent)) {
    return new NextResponse('Access Denied: Scrapers and automated client agents are blocked.', {
      status: 403,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // 2. Request flooding & rate limit checks
  if (isRateLimited(ip)) {
    return new NextResponse('Too Many Requests: Rate limit exceeded. Please slow down.', {
      status: 429,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
  
  // Normalize path for dynamic routes like /admin/users/[id]
  const normalizedPath = path.split('/').slice(0, 3).join('/');

  // Get the session from the cookie
  const cookieStore = await cookies();
  const cookie = cookieStore.get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const user: User | null = session?.user ?? null;

  // Handle mandatory password change
  if (user?.requiresPasswordChange && path !== '/force-password-change') {
    return applySecurityHeaders(NextResponse.redirect(new URL('/force-password-change', req.nextUrl)));
  }
  
  // If user does not need password change but is on the change page, redirect away
  if (user && !user.requiresPasswordChange && path === '/force-password-change') {
    const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return applySecurityHeaders(NextResponse.redirect(new URL(dashboardPath, req.nextUrl)));
  }

  // Redirect logged-in users from public routes
  if (isPublicRoute && user && path !== '/force-password-change') {
    const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return applySecurityHeaders(NextResponse.redirect(new URL(dashboardPath, req.nextUrl)));
  }

  // Redirect logged-out users from protected routes
  if (!isPublicRoute && !user) {
    return applySecurityHeaders(NextResponse.redirect(new URL('/login', req.nextUrl)));
  }
  
  if (user) {
      // Protect admin routes from non-admin users
      if ((adminRoutes.includes(path) || adminRoutes.includes(normalizedPath) || path.startsWith('/admin/users/')) && user.role !== 'admin') {
          return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard', req.nextUrl)));
      }

      // Protect user routes from admin users
      if (userRoutes.includes(path) && user.role === 'admin') {
          return applySecurityHeaders(NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl)));
      }
  }

  // Refresh the session if it's about to expire
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
          return applySecurityHeaders(response);
      }
  }
  
  return applySecurityHeaders(NextResponse.next());
}

// Match all routes except for static files and specific API routes.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|verify-email).*)'],
};
