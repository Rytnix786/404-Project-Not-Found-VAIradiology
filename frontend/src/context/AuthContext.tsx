'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCookie, setCookie, eraseCookie } from '@/lib/cookies';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  date_joined: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if a session cookie exists on application mount
  useEffect(() => {
    async function loadUserFromCookie() {
      const savedToken = getCookie('auth_token');
      if (savedToken) {
        try {
          const res = await fetch(`${API_URL}/api/auth/me/`, {
            headers: {
              'Authorization': `Token ${savedToken}`,
            },
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setToken(savedToken);
          } else {
            // Clear invalid cookie
            eraseCookie('auth_token');
          }
        } catch (err) {
          console.error('Failed to load user session', err);
          // If server is unreachable, we don't clear the cookie yet, but set loading false
        }
      }
      setLoading(false);
    }
    loadUserFromCookie();
  }, []);

  const login = async (email: string, password: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch(`${API_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await res.json();
      
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        // Save token in cookie (expires in 7 days)
        setCookie('auth_token', data.token, 7);
        return { success: true };
      } else {
        const errorMsg = data.non_field_errors?.[0] || 'Login failed. Please check your credentials.';
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, error: 'Server took too long to respond. Please try signing in again.' };
      }
      return { success: false, error: 'Cannot connect to the server.' };
    }
  };

  const logout = async () => {
    const savedToken = token || getCookie('auth_token');
    if (savedToken) {
      try {
        await fetch(`${API_URL}/api/auth/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${savedToken}`,
          },
        });
      } catch (err) {
        console.error('Server-side logout token revocation failed', err);
      }
    }
    
    // Always clear client-side state
    setToken(null);
    setUser(null);
    eraseCookie('auth_token');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
