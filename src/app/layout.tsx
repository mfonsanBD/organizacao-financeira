import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ReactQueryProvider } from '@/components/providers/react-query-provider';
import { OfflineSyncProvider } from '@/components/providers/offline-sync-provider';
import { ServiceWorkerRegister } from '@/components/providers/service-worker-register';
import { Toaster } from '@/components/ui/sonner';
import { Lexend, Poppins } from "next/font/google";

const lexend = Lexend({ 
  subsets: ["latin"],
  variable: "--font-lexend",
});

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

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
  themeColor: '#0d9488',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${lexend.variable} ${poppins.variable} font-poppins antialiased`}>
        <AuthProvider>
          <ReactQueryProvider>
            <OfflineSyncProvider>
              <ServiceWorkerRegister />
              {children}
              <Toaster richColors theme='light' />
            </OfflineSyncProvider>
          </ReactQueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
