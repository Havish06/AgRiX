'use client';

import { ReactNode } from 'react';
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
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analysis', href: '/dashboard/analysis', icon: BarChart2 },
  { name: 'Forecast', href: '/dashboard/forecast', icon: LineChart },
  { name: 'Scenarios', href: '/dashboard/scenarios', icon: Zap },
  { name: 'Model Lab', href: '/dashboard/model-lab', icon: FlaskConical },
  { name: 'Research', href: '/dashboard/research', icon: BookOpen },
];

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
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
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transform transition-transform duration-300 ease-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="panel-raised p-2">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="font-serif text-heading-sm text-text">AgRiX</span>
            </Link>
            <button
              className="lg:hidden btn-raised btn-secondary p-2"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Dashboard">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-body-sm font-medium transition-all duration-[var(--transition-fast)]',
                    isActive
                      ? 'bg-primary-light text-primary'
                      : 'text-text-muted hover:bg-surface-elevated hover:text-text'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-body-sm font-medium text-text-muted hover:bg-surface-elevated hover:text-text transition-all"
            >
              <Settings className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              Settings
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 lg:px-8">
          <button
            className="lg:hidden btn-raised btn-secondary p-2"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            aria-expanded={sidebarOpen}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 panel-inset rounded-[4px] text-caption text-text-muted">
              <span className="font-mono">v0.1.0</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}