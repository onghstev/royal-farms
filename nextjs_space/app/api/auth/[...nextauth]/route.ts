export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import NextAuth from 'next-auth';
import { getAuthOptions } from '@/lib/auth-options';

// Create handler lazily - only when request comes in
let _handler: ReturnType<typeof NextAuth> | null = null;

function getHandler() {
  if (!_handler) {
    _handler = NextAuth(getAuthOptions());
  }
  return _handler;
}

export async function GET(request: Request, context: any) {
  return getHandler()(request, context);
}

export async function POST(request: Request, context: any) {
  return getHandler()(request, context);
}
