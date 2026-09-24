import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { AppNavbar } from '@/components/layout/AppNavbar';

export const metadata: Metadata = {
  title: 'EduEye — Autonomous Cognitive Remediation Engine',
  description: 'FlowBuild Hackathon: Intelligent Automation & Adaptive Scheduling',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased text-slate-900">
        <AppProvider>
          <AppNavbar />
          <main>{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
