
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from '@/components/app-provider';
import { getSession } from '@/lib/session';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'S&KGPPS Co-op',
  description:
    'Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSession();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
          <AppProvider user={user}>{children}</AppProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
