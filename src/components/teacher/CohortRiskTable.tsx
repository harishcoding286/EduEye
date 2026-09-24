'use client';

import React from 'react';
import type { StudentProfile } from '@/types';
import { StudentRosterTable } from './StudentRosterTable';

export interface CohortRiskTableProps {
  cohort?: StudentProfile[];
  onSelectStudent?: (id: string) => void;
}

export function CohortRiskTable({ onSelectStudent }: CohortRiskTableProps) {
  return <StudentRosterTable onSelectStudent={onSelectStudent} />;
}

export default CohortRiskTable;
