'use client';

import React from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import type { StudentAnalytics } from '@/types/student-db';

interface DashboardViewProps {
  analytics: StudentAnalytics;
  studentName: string;
}

// ── KPI Badge ─────────────────────────────────────────────────────────────────
function KPIBadge({
  label,
  value,
  unit,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border flex flex-col gap-1 ${
        accent
          ? 'bg-[#3368A0] border-[#3368A0] text-white'
          : 'bg-white/85 border-white shadow-[0_8px_24px_-4px_rgba(51,104,160,0.1)]'
      }`}
    >
      <span
        className={`text-[10px] font-black uppercase tracking-widest ${
          accent ? 'text-[#C8DFDB]' : 'text-[#66A3BF]'
        }`}
      >
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span
          className={`text-3xl font-black tracking-tight ${
            accent ? 'text-white' : 'text-[#3368A0]'
          }`}
        >
          {value}
        </span>
        {unit && (
          <span
            className={`text-sm font-bold ${accent ? 'text-[#C8DFDB]' : 'text-[#66A3BF]'}`}
          >
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <span
          className={`text-[11px] font-medium ${accent ? 'text-[#C8DFDB]' : 'text-slate-500'}`}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 border border-[#C8DFDB] rounded-xl p-3 shadow-lg text-xs">
      <p className="font-black text-slate-800 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-bold text-slate-900">{p.value}/50</span>
        </div>
      ))}
    </div>
  );
}

export function DashboardView({ analytics, studentName }: DashboardViewProps) {
  const { attendancePct, avgAssignmentRate, avgCATScore, subjects } = analytics;

  // Data for multi-bar chart (CAT1 vs CAT2)
  const catChartData = subjects.map((s) => ({
    name: s.name.split(' ')[0], // short name
    'CAT 1': s.cat1Score,
    'CAT 2': s.cat2Score,
  }));

  // Data for attendance radial gauge
  const attendanceData = [
    {
      name: 'Attended',
      value: Math.round(attendancePct),
      fill: '#3368A0',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_12px_32px_-8px_rgba(51,104,160,0.12)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#66A3BF] mb-0.5">
              Academic Dashboard
            </p>
            <h1 className="text-2xl font-black text-[#3368A0] tracking-tight">
              {studentName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Semester 5 · Computer Science & Engineering · 2025–26
            </p>
          </div>
          <Link
            href="/analytics"
            className="self-start sm:self-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#3368A0] hover:bg-[#2b5887] transition shadow-sm"
          >
            View Full Analytics →
          </Link>
        </div>
      </div>

      {/* KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <KPIBadge
          label="Overall Attendance"
          value={attendancePct.toFixed(1)}
          unit="%"
          sub={`${analytics.subjects.length > 0 ? '' : ''}78 / 90 days`}
          accent={attendancePct < 75}
        />
        <KPIBadge
          label="Avg Assignment Completion"
          value={avgAssignmentRate.toFixed(1)}
          unit="%"
          sub="All subjects combined"
        />
        <KPIBadge
          label="Avg CAT Score"
          value={avgCATScore.toFixed(1)}
          unit="%"
          sub="Normalised across all subjects"
          accent={avgCATScore < 60}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CAT Performance Chart — clickable, navigates to /analytics */}
        <Link
          href="/analytics"
          className="lg:col-span-2 block group"
        >
          <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_12px_32px_-8px_rgba(51,104,160,0.12)] p-6 h-full transition-all group-hover:shadow-[0_16px_40px_-8px_rgba(51,104,160,0.2)] group-hover:border-[#C8DFDB] group-hover:scale-[1.005]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#66A3BF] mb-0.5">
                  CAT Performance
                </p>
                <h2 className="text-base font-black text-slate-900">
                  CAT 1 vs CAT 2 — All Subjects
                </h2>
              </div>
              <span className="text-[10px] font-bold text-[#3368A0] bg-[#C8DFDB]/30 px-2.5 py-1 rounded-lg border border-[#C8DFDB] group-hover:bg-[#3368A0] group-hover:text-white transition">
                Click to drill down →
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={catChartData} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EEF2" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 50]}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}
                />
                <Bar dataKey="CAT 1" fill="#66A3BF" radius={[6, 6, 0, 0]} />
                <Bar dataKey="CAT 2" fill="#3368A0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Link>

        {/* Attendance Radial Gauge */}
        <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white shadow-[0_12px_32px_-8px_rgba(51,104,160,0.12)] p-6 flex flex-col">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#66A3BF] mb-0.5">
              Attendance
            </p>
            <h2 className="text-base font-black text-slate-900">
              Semester Progress
            </h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <ResponsiveContainer width="100%" height={160}>
              <RadialBarChart
                cx="50%"
                cy="80%"
                innerRadius="70%"
                outerRadius="100%"
                startAngle={180}
                endAngle={0}
                data={attendanceData}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  dataKey="value"
                  cornerRadius={8}
                  background={{ fill: '#C8DFDB', opacity: 0.4 }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="text-center -mt-4">
              <div className="text-3xl font-black text-[#3368A0]">
                {attendancePct.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                78 attended / 90 total days
              </div>
            </div>
            <div
              className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                attendancePct >= 75
                  ? 'bg-[#C8DFDB]/40 text-[#3368A0] border-[#C8DFDB]'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {attendancePct >= 75 ? 'Eligible' : 'At Risk'}
            </div>
          </div>
        </div>
      </div>

      {/* Critical subject alert */}
      <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-rose-200 shadow-[0_12px_32px_-8px_rgba(220,38,38,0.1)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-0.5">
              Critical Deficit Detected
            </p>
            <p className="text-sm font-bold text-slate-900">
              {analytics.criticalSubject.name} — avg {analytics.criticalSubject.avgCATScore.toFixed(1)}% &amp; declining
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Immediate remediation required. AI-generated quiz is ready.
            </p>
          </div>
        </div>
        <Link
          href="/analytics"
          className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 transition shadow-sm"
        >
          View Diagnostic →
        </Link>
      </div>
    </div>
  );
}
