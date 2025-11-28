/**
 * MODULE 7 - Navbar Component - Sui Overflow 2024 Style
 *
 * Features:
 * - Mobile-first pill navigation
 * - Modern dark theme with sky-blue accents
 * - Fixed bottom nav on mobile, top nav on desktop
 * - Wallet connection
 */

import { Link, useLocation } from 'react-router-dom';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Button } from './ui/button';
import { LogOut, QrCode, Home, Shield, Trophy, Bot, Wallet2 } from 'lucide-react';
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
    <>
      {/* Desktop/Tablet Top Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 max-w-5xl">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="text-3xl">🌊</div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-sky-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent group-hover:from-sky-300 group-hover:via-cyan-300 group-hover:to-indigo-300 transition-all">
                  LémanFlow
                </h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wide">GASLESS REWARDS</p>
              </div>
            </Link>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-1.5">
              <Link to="/dashboard">
                <Button
                  variant={isActive('/dashboard') ? 'default' : 'ghost'}
                  size="sm"
                  className={`gap-2 rounded-full ${
                    isActive('/dashboard')
                      ? 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400'
                      : 'hover:bg-slate-800'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>

              <Link to="/scan">
                <Button
                  variant={isActive('/scan') ? 'default' : 'ghost'}
                  size="sm"
                  className={`gap-2 rounded-full ${
                    isActive('/scan')
                      ? 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400'
                      : 'hover:bg-slate-800'
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  Scan
                </Button>
              </Link>

              {account && (
                <>
                  <Link to="/passport">
                    <Button
                      variant={isActive('/passport') ? 'default' : 'ghost'}
                      size="sm"
                      className={`gap-2 rounded-full ${
                        isActive('/passport')
                          ? 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400'
                          : 'hover:bg-slate-800'
                      }`}
                    >
                      <Wallet2 className="h-4 w-4" />
                      Passport
                    </Button>
                  </Link>

                  <Link to="/hackfolio">
                    <Button
                      variant={isActive('/hackfolio') ? 'default' : 'ghost'}
                      size="sm"
                      className={`gap-2 rounded-full ${
                        isActive('/hackfolio')
                          ? 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400'
                          : 'hover:bg-slate-800'
                      }`}
                    >
                      <Trophy className="h-4 w-4" />
                      Hackfolio
                    </Button>
                  </Link>

                  <Link to="/admin">
                    <Button
                      variant={isActive('/admin') ? 'default' : 'ghost'}
                      size="sm"
                      className={`gap-2 rounded-full ${
                        isActive('/admin')
                          ? 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400'
                          : 'hover:bg-slate-800'
                      }`}
                    >
                      <Shield className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>

                  <Link to="/ai-agents">
                    <Button
                      variant={isActive('/ai-agents') ? 'default' : 'ghost'}
                      size="sm"
                      className={`gap-2 rounded-full ${
                        isActive('/ai-agents')
                          ? 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400'
                          : 'hover:bg-slate-800'
                      }`}
                    >
                      <Bot className="h-4 w-4" />
                      Agents
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Right Side: Wallet & Logout */}
            <div className="hidden md:flex items-center gap-2">
              <ConnectButton />

              {account && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              )}
            </div>

            {/* Mobile: Just Wallet */}
            <div className="md:hidden">
              <ConnectButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 z-50 safe-area-bottom">
        <div className="flex justify-around items-center px-2 py-3">
          <Link to="/dashboard" className="flex flex-col items-center gap-1 flex-1">
            <div
              className={`p-2.5 rounded-2xl transition-all ${
                isActive('/dashboard')
                  ? 'bg-gradient-to-br from-sky-500 to-cyan-500 shadow-lg shadow-sky-500/50'
                  : 'text-slate-400'
              }`}
            >
              <Home className="h-5 w-5" />
            </div>
            <span
              className={`text-[10px] font-medium ${
                isActive('/dashboard') ? 'text-sky-400' : 'text-slate-500'
              }`}
            >
              Home
            </span>
          </Link>

          <Link to="/scan" className="flex flex-col items-center gap-1 flex-1">
            <div
              className={`p-2.5 rounded-2xl transition-all ${
                isActive('/scan')
                  ? 'bg-gradient-to-br from-sky-500 to-cyan-500 shadow-lg shadow-sky-500/50'
                  : 'text-slate-400'
              }`}
            >
              <QrCode className="h-5 w-5" />
            </div>
            <span
              className={`text-[10px] font-medium ${
                isActive('/scan') ? 'text-sky-400' : 'text-slate-500'
              }`}
            >
              Scan
            </span>
          </Link>

          {account && (
            <>
              <Link to="/passport" className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`p-2.5 rounded-2xl transition-all ${
                    isActive('/passport')
                      ? 'bg-gradient-to-br from-sky-500 to-cyan-500 shadow-lg shadow-sky-500/50'
                      : 'text-slate-400'
                  }`}
                >
                  <Wallet2 className="h-5 w-5" />
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    isActive('/passport') ? 'text-sky-400' : 'text-slate-500'
                  }`}
                >
                  Passport
                </span>
              </Link>

              <Link to="/hackfolio" className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`p-2.5 rounded-2xl transition-all ${
                    isActive('/hackfolio')
                      ? 'bg-gradient-to-br from-sky-500 to-cyan-500 shadow-lg shadow-sky-500/50'
                      : 'text-slate-400'
                  }`}
                >
                  <Trophy className="h-5 w-5" />
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    isActive('/hackfolio') ? 'text-sky-400' : 'text-slate-500'
                  }`}
                >
                  Hackfolio
                </span>
              </Link>

              <Link to="/admin" className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`p-2.5 rounded-2xl transition-all ${
                    isActive('/admin')
                      ? 'bg-gradient-to-br from-sky-500 to-cyan-500 shadow-lg shadow-sky-500/50'
                      : 'text-slate-400'
                  }`}
                >
                  <Shield className="h-5 w-5" />
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    isActive('/admin') ? 'text-sky-400' : 'text-slate-500'
                  }`}
                >
                  Admin
                </span>
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
