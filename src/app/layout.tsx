import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { AppNavbar } from '@/components/layout/AppNavbar';

export const metadata: Metadata = {
  title: 'EduEye — Cognitive Scheduling & Remediation',
  description: 'Closed-Loop Cognitive Scheduling & Autonomous Gap Remediation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased text-slate-800 relative selection:bg-[#C8DFDB] selection:text-[#3368A0]">
        <AppProvider>
          <AppNavbar />
          <main className="relative">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
