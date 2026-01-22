import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes without any checks
  if (
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  const token = await getToken({ req: request });

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/flocks/:path*',
    '/batches/:path*',
    '/egg-collection/:path*',
    '/mortality/:path*',
    '/feed/:path*',
    '/reports/:path*',
  ],
};
