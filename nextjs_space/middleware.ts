export { default } from 'next-auth/middleware';

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
