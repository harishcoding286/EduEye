'use client';

import React from 'react';
import { AppNavbar } from './AppNavbar';
import type { Role } from '@/types';

export interface NavbarProps {
  userName?: string;
  role?: Role;
}

export function Navbar({ userName = 'Dr. Sarah Chen', role = 'TEACHER' }: NavbarProps) {
  return <AppNavbar userName={userName} role={role} />;
}

export default Navbar;
