'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  FileText,
  LogOut,
  Menu,
  X,
  Palette,
  Bell,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { OnlineStatusIndicator } from '@/components/dashboard/OnlineStatusIndicator';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Rendas', href: '/income', icon: TrendingUp },
  { name: 'Despesas', href: '/expense', icon: TrendingDown },
  { name: 'Orçamentos', href: '/budget', icon: PiggyBank },
  { name: 'A Receber', href: '/receivable', icon: FileText },
  { name: 'Categorias', href: '/categories', icon: Palette },
  { name: 'Notificações', href: '/notifications', icon: Bell },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar for desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold">Finanças Familiares</h2>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <div className="mb-3 px-3">
            <p className="text-sm font-medium">{session?.user?.name}</p>
            <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 border-r bg-background">
            <div className="flex h-16 items-center justify-between border-b px-6">
              <h2 className="text-lg font-semibold">Finanças</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t p-4">
              <div className="mb-3 px-3">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-16 items-center gap-4 border-b px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Finanças Familiares</h1>
          <div className="ml-auto flex items-center gap-2">
            <OnlineStatusIndicator />
            <NotificationBell />
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden lg:flex h-16 items-center justify-end gap-4 border-b px-6">
          <OnlineStatusIndicator />
          <NotificationBell />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
