'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  currentTenant: TenantInfo | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchTenant: (tenantId: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentTenant, setCurrentTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedTenant = localStorage.getItem('currentTenant');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      if (savedTenant) setCurrentTenant(JSON.parse(savedTenant));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, user: userData } = res.data;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.removeItem('currentTenant');
    setToken(accessToken);
    setUser(userData);
    setCurrentTenant(null);
    router.push('/');
  };

  const switchTenant = async (tenantId: string) => {
    const res = await api.post(`/auth/switch-tenant/${tenantId}`);
    const { accessToken, user: userData, tenant } = res.data;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('currentTenant', JSON.stringify(tenant));
    setToken(accessToken);
    setUser(userData);
    setCurrentTenant(tenant);
    // Reload to refresh all data with new tenant context
    window.location.href = '/';
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentTenant');
    setToken(null);
    setUser(null);
    setCurrentTenant(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, currentTenant, login, logout, switchTenant, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
