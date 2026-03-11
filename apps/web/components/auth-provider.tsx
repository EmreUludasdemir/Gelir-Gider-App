'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api-base';
import { getCurrentUser, logoutUser, refreshUserSession, SessionUser } from '@/lib/api';

interface User extends SessionUser {}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (user?: User | null) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => {},
    logout: async () => {},
    isAuthenticated: false,
    fetchWithAuth: async () => new Response(),
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        void checkUser();
    }, []);

    useEffect(() => {
        if (!loading) {
            const isAuthPage = pathname?.startsWith('/auth');
            const isPublicPage = pathname === '/';

            if (!user && !isAuthPage && !isPublicPage) {
                router.push('/auth/login');
            } else if (user && isAuthPage) {
                router.push('/dashboard');
            }
        }
    }, [user, loading, pathname, router]);

    const checkUser = async () => {
        try {
            const profile = await getCurrentUser();
            setUser(profile);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (userData?: User | null) => {
        setLoading(true);
        try {
            if (userData) {
                setUser(userData);
            } else {
                const profile = await getCurrentUser();
                setUser(profile);
            }
            window.location.assign('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await logoutUser();
        } catch {
            // Keep client state consistent even if the API call fails.
        }

        setUser(null);
        router.push('/auth/login');
    };

    const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
        const apiBaseUrl = getApiBaseUrl();
        const resolvedUrl =
            /^https?:\/\//i.test(url) || url.startsWith('/api')
                ? url
                : `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
        const headers = new Headers(options.headers);

        if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }

        let response = await fetch(resolvedUrl, {
            ...options,
            headers,
            credentials: 'include',
        });

        if (response.status === 401) {
            const refreshed = await refreshUserSession().then(() => true).catch(() => false);
            if (refreshed) {
                response = await fetch(resolvedUrl, {
                    ...options,
                    headers,
                    credentials: 'include',
                });
            }
        }

        if (response.status === 401) {
            await logout();
        }

        return response;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user, fetchWithAuth }}>
            {children}
        </AuthContext.Provider>
    );
}
