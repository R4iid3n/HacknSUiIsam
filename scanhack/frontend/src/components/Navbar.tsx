'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthClient } from '@/lib/ic-auth';
import { Button } from './ui/button';

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, logout, principal } = useAuthClient();

  if (!isAuthenticated) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/scan', label: 'Scan QR' },
    { href: '/passport', label: 'My Passport' },
    { href: '/admin', label: 'Admin' },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ScanHack
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === item.href
                      ? 'border-blue-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {principal && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {principal.toText().slice(0, 8)}...
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

