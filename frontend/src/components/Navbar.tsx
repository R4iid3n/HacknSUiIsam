/**
 * MODULE 7 - Navbar Component
 *
 * Features:
 * - Logo
 * - Navigation links
 * - "My Passport" link
 * - Wallet connection
 * - Logout button
 */

import { Link, useLocation } from 'react-router-dom';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Button } from './ui/button';
import { LogOut, Wallet2, QrCode, Home, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export function Navbar() {
  const account = useCurrentAccount();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="text-3xl">🌊</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-700 transition-all">
                LémanFlow
              </h1>
              <p className="text-xs text-muted-foreground">Gasless Rewards Platform</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/dashboard">
              <Button
                variant={isActive('/dashboard') ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>

            <Link to="/scan">
              <Button
                variant={isActive('/scan') ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <QrCode className="h-4 w-4" />
                Scan QR
              </Button>
            </Link>

            {account && (
              <Link to="/passport">
                <Button
                  variant={isActive('/passport') ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <Wallet2 className="h-4 w-4" />
                  My Passport
                </Button>
              </Link>
            )}

            {/* Admin link - only show if user has admin rights */}
            {account && (
              <Link to="/admin">
                <Button
                  variant={isActive('/admin') ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
          </div>

          {/* Right Side: Wallet & Logout */}
          <div className="flex items-center gap-3">
            <ConnectButton />

            {account && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-4 flex gap-2 overflow-x-auto pb-2">
          <Link to="/dashboard" className="flex-shrink-0">
            <Button
              variant={isActive('/dashboard') ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>

          <Link to="/scan" className="flex-shrink-0">
            <Button
              variant={isActive('/scan') ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
            >
              <QrCode className="h-4 w-4" />
              Scan
            </Button>
          </Link>

          {account && (
            <Link to="/passport" className="flex-shrink-0">
              <Button
                variant={isActive('/passport') ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Wallet2 className="h-4 w-4" />
                Passport
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
