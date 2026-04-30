import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Lấy token từ cookie[cite: 1]
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Nếu chưa có token mà vào trang yêu cầu login
  if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/chat'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Nếu đã có token mà vẫn cố vào trang login/register
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/chat/:path*', '/login', '/register'],
};