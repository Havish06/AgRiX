'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  BarChart2,
  LineChart,
  Zap,
  FlaskConical,
  BookOpen,
  Settings,
  Menu,
  X,
  Shield,
} from 'lucide-react';

const navigation = [
  { name: 'Season lens', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Data check', href: '/analysis', icon: BarChart2 },
  { name: 'Forecast', href: '/forecast', icon: LineChart },
  { name: 'Stress paths', href: '/scenarios', icon: Zap },
  { name: 'Model ledger', href: '/model-lab', icon: FlaskConical },
  { name: 'Research', href: '/research', icon: BookOpen },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-surface transition-transform duration-300 ease-out lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="panel-raised p-2">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="font-serif text-heading-sm text-text">AgRiX</span>
            </Link>
            <button
              className="btn-raised btn-secondary p-2 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav
            className="flex-1 space-y-1 overflow-y-auto p-4"
            role="navigation"
            aria-label="Dashboard"
          >
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-body-sm font-medium transition-all duration-[var(--transition-fast)]',
                    isActive
                      ? 'bg-primary-light text-primary'
                      : 'text-text-muted hover:bg-surface-elevated hover:text-text'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-body-sm font-medium text-text-muted transition-all hover:bg-surface-elevated hover:text-text"
            >
              <Settings className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              Settings
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="bg-background/80 sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border px-4 backdrop-blur-sm lg:px-8">
          <button
            className="btn-raised btn-secondary p-2 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            aria-expanded={sidebarOpen}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="ml-auto flex items-center gap-4">
            <div className="panel-inset hidden items-center gap-2 rounded-[4px] px-3 py-1.5 text-caption text-text-muted sm:flex">
              <span className="font-mono">v0.1.0</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
