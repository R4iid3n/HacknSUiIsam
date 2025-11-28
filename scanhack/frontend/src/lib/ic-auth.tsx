'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { IDENTITY_PROVIDER } from '@/config';

interface AuthContextType {
  isAuthenticated: boolean;
  principal: Principal | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  authClient: AuthClient | null;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  principal: null,
  login: async () => {},
  logout: async () => {},
  loading: true,
  authClient: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [loading, setLoading] = useState(true);
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const client = await AuthClient.create();
      setAuthClient(client);
      const isAuth = await client.isAuthenticated();
      setIsAuthenticated(isAuth);
      if (isAuth) {
        setPrincipal(client.getIdentity().getPrincipal());
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    try {
      if (!authClient) {
        const client = await AuthClient.create();
        setAuthClient(client);
        await client.login({
          identityProvider: IDENTITY_PROVIDER,
          onSuccess: () => {
            setIsAuthenticated(true);
            setPrincipal(client.getIdentity().getPrincipal());
          },
        });
      } else {
        await authClient.login({
          identityProvider: IDENTITY_PROVIDER,
          onSuccess: () => {
            setIsAuthenticated(true);
            setPrincipal(authClient.getIdentity().getPrincipal());
          },
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  async function logout() {
    try {
      if (authClient) {
        await authClient.logout();
        setIsAuthenticated(false);
        setPrincipal(null);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, principal, login, logout, loading, authClient }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthClient() {
  return useContext(AuthContext);
}
