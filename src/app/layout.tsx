import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { AppNavbar } from '@/components/layout/AppNavbar';

export const metadata: Metadata = {
  title: 'EduEye 🫧✨ — Cute Frutiger Aero Study Engine',
  description: 'Closed-Loop Cognitive Scheduling & Autonomous Gap Remediation with Cute Aesthetic',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased text-slate-800 relative selection:bg-pink-300 selection:text-slate-900">
        <AppProvider>
          <AppNavbar />
          <main className="relative z-10">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
