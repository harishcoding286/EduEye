import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { AppNavbar } from '@/components/layout/AppNavbar';

export const metadata: Metadata = {
  title: 'EduEye — FlowBuild Autonomous Remediation Engine',
  description: 'Closed-Loop Cognitive Scheduling & Telemetry Remediation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-[#EBF5FF] via-[#F4F9FF] to-[#FFFFFF] antialiased text-slate-800 relative selection:bg-cyan-200 selection:text-slate-900">
        {/* Soft, low-opacity ambient light blooms in opposite corners */}
        <div className="fixed -top-48 -left-48 w-[38rem] h-[38rem] bg-sky-300/15 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="fixed -bottom-48 -right-48 w-[42rem] h-[42rem] bg-indigo-300/12 rounded-full blur-[160px] pointer-events-none -z-10" />
        <div className="fixed top-1/3 -right-24 w-80 h-80 bg-teal-200/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <AppProvider>
          <AppNavbar />
          <main className="relative z-10">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
