import React from 'react';

interface IconProps {
  style?: React.CSSProperties;
  className?: string;
}

export const DolphinIcon = ({ style, className }: IconProps) => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={style} className={className}>
    <path d="M24 10C24 10 22 6 17 6C12 6 10 9 10 9L7 8L8 11C8 11 5 14 5 18C5 22 9 24 9 24L10 22C10 22 12 23 14 23C16 23 18 22 18 22L19 24C19 24 23 22 23 18C23 14 20 12 20 12L22 11L24 10Z" fill="#1890ff" stroke="#1890ff" strokeWidth="0.5"/>
    <circle cx="13" cy="12" r="1.2" fill="white"/>
    <path d="M15 14C15 14 16 15 17 14.5" stroke="white" strokeWidth="0.8" strokeLinecap="round"/>
  </svg>
);

export const DolphinIconSmall = ({ style, className }: IconProps) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={style} className={className}>
    <rect width="32" height="32" rx="6" fill="#1890ff"/>
    <path d="M23 9C23 9 21 5 16 5C11 5 9 8 9 8L6 7L7 10C7 10 4 13 4 17C4 21 8 23 8 23L9 21C9 21 11 22 13 22C15 22 17 21 17 21L18 23C18 23 22 21 22 17C22 13 19 11 19 11L21 10L23 9Z" fill="white"/>
    <circle cx="12" cy="11" r="1.2" fill="#1890ff"/>
    <path d="M14 13C14 13 15 14 16 13.5" stroke="#1890ff" strokeWidth="0.8" strokeLinecap="round"/>
  </svg>
);

export const EnvIcon = ({ style, className }: IconProps) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={style} className={className}>
    <rect x="1" y="2" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <circle cx="5" cy="7" r="1.5" fill="currentColor"/>
    <line x1="8" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="8" y1="9" x2="11" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const ChartIcon = ({ style, className }: IconProps) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={style} className={className}>
    <rect x="1" y="9" width="3" height="6" rx="0.5" fill="currentColor"/>
    <rect x="5.5" y="5" width="3" height="10" rx="0.5" fill="currentColor"/>
    <rect x="10" y="1" width="3" height="14" rx="0.5" fill="currentColor"/>
  </svg>
);

export const IndicatorIcon = ({ style, className }: IconProps) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={style} className={className}>
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M8 2V8L12 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const DashboardIcon = ({ style, className }: IconProps) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={style} className={className}>
    <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

export const TimelineIcon = ({ style, className }: IconProps) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={style} className={className}>
    <line x1="3" y1="2" x2="3" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="3" cy="4" r="1.5" fill="currentColor"/>
    <circle cx="3" cy="8" r="1.5" fill="currentColor"/>
    <circle cx="3" cy="12" r="1.5" fill="currentColor"/>
    <line x1="5" y1="4" x2="13" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="5" y1="12" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const AlertIcon = ({ style, className }: IconProps) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={style} className={className}>
    <path d="M8 1L15 14H1L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
    <line x1="8" y1="6" x2="8" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="8" cy="12" r="0.75" fill="currentColor"/>
  </svg>
);
