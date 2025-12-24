import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value
    const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
    const isPublicPage = request.nextUrl.pathname === '/'
    
    // If accessing protected routes without token, redirect to login
    if (!token && !isAuthPage && !isPublicPage) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    // If accessing root, redirect to login
    if (request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    // If logged in and trying to access auth pages, redirect to dashboard
    if (token && isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    return NextResponse.next()
}

export const config = {
    matcher: ['/', '/dashboard/:path*', '/transactions/:path*', '/auth/:path*', '/settings/:path*'],
}
