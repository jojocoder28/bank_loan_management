
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from '@/components/app-provider';
import AuthProvider from '@/components/auth-provider';

export const metadata: Metadata = {
  title: 'Co-op Bank Manager',
  description:
    'A user-friendly dashboard for managing cooperative loans and funds.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        ></link>
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <AppProvider>{children}</AppProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
