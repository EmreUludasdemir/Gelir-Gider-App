import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Simple check if token exists in cookie is hard for client-side headers
    // For this simple app, we rely on client-side protection in AuthProvider
    // However, we can add a basic check if we stored token in cookies
    // But our implementation uses localStorage which middleware can't access
    // So we'll skip middleware for now and rely on AuthProvider
    // Or we can just redirect root to dashboard if needed

    if (request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }
}

export const config = {
    matcher: ['/'],
}
