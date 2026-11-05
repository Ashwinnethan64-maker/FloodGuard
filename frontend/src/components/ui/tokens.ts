import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DESIGN_TOKENS = {
  colors: {
    primaryIndigo: '#533afd',
    hoverIndigo: '#7389ff',
    midnightNavy: '#061b31',
    secondaryText: '#64748d',
    mutedText: '#50617a',
    whiteCanvas: '#ffffff',
    lightBg: '#f8fafd',
    borders: '#e5edf5',
    lavenderSurface: '#e8e9ff',
  },
  status: {
    open: {
      text: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      label: 'Passable / Open',
    },
    caution: {
      text: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
      label: 'Caution / Waterlogged',
    },
    blocked: {
      text: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
      label: 'Submerged / Inundated',
    },
    unverified: {
      text: '#6366f1',
      bg: '#eef2ff',
      border: '#c7d2fe',
      label: 'Unverified Citizen Report',
    },
  },
};

