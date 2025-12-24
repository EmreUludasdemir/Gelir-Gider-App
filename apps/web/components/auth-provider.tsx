'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
    id: string;
    email: string;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: () => { },
    logout: () => { },
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
        checkUser();
    }, []);

    useEffect(() => {
        if (!loading) {
            const isAuthPage = pathname?.startsWith('/auth');
            const isPublicPage = pathname === '/'; // Landing page if exists

            if (!user && !isAuthPage && !isPublicPage) {
                router.push('/auth/login');
            } else if (user && isAuthPage) {
                router.push('/dashboard');
            }
        }
    }, [user, loading, pathname]);

    const checkUser = () => {
        try {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (token && storedUser) {
                setUser(JSON.parse(storedUser));
            } else {
                setUser(null);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = (token: string, userData: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        // Set cookie for middleware auth check
        document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        setUser(userData);
        // Use window.location for full page reload to ensure middleware picks up the cookie
        window.location.href = '/dashboard';
    };

    const logout = () => {
        localStorage.removeItem('token');
        // Clear auth cookie
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        localStorage.removeItem('user');
        setUser(null);
        router.push('/auth/login');
    };

    const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        // Token expired - logout user
        if (response.status === 401) {
            logout();
        }

        return response;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user, fetchWithAuth }}>
            {children}
        </AuthContext.Provider>
    );
}
