'use client';

import React from 'react';
import { AppNavbar } from './AppNavbar';

export interface NavbarProps {
  userName?: string;
}

export function Navbar({ userName = 'Ram' }: NavbarProps) {
  return <AppNavbar userName={userName} />;
}

export default Navbar;
