import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ReactQueryProvider } from '@/components/providers/react-query-provider';
import { OfflineSyncProvider } from '@/components/providers/offline-sync-provider';
import { ServiceWorkerRegister } from '@/components/providers/service-worker-register';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Organização Financeira',
  description: 'Sistema de organização financeira familiar',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Organização Financeira',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <ReactQueryProvider>
            <OfflineSyncProvider>
              <ServiceWorkerRegister />
              {children}
              <Toaster />
            </OfflineSyncProvider>
          </ReactQueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
